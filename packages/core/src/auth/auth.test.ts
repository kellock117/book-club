import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimit } from './rate-limit';
import { safeNextPath } from './redirect';
import { createSessionToken, safeEqual, SESSION_MAX_AGE_SEC, verifySessionToken } from './session';

const NOW = Date.UTC(2026, 10, 10);

describe('세션 토큰', () => {
  it('만든 토큰은 같은 비밀번호로 검증된다', () => {
    expect(verifySessionToken(createSessionToken('pw', NOW), 'pw', NOW)).toBe(true);
  });
  it('다른 비밀번호, 변조, 형식 오류는 거절한다', () => {
    const t = createSessionToken('pw', NOW);
    expect(verifySessionToken(t, 'other', NOW)).toBe(false);
    const [exp, sig] = t.split('.');
    expect(verifySessionToken(`${Number(exp) + 99999}.${sig}`, 'pw', NOW)).toBe(false);
    expect(verifySessionToken('garbage', 'pw', NOW)).toBe(false);
    expect(verifySessionToken(`${exp}.${sig}.extra`, 'pw', NOW)).toBe(false);
    expect(verifySessionToken(undefined, 'pw', NOW)).toBe(false);
    expect(verifySessionToken(t, undefined, NOW)).toBe(false);
    expect(verifySessionToken(t, '', NOW)).toBe(false);
  });
  it('30일 뒤에는 만료된다', () => {
    const t = createSessionToken('pw', NOW);
    expect(verifySessionToken(t, 'pw', NOW + (SESSION_MAX_AGE_SEC - 5) * 1000)).toBe(true);
    expect(verifySessionToken(t, 'pw', NOW + (SESSION_MAX_AGE_SEC + 5) * 1000)).toBe(false);
  });
});

describe('safeEqual', () => {
  it('같으면 true, 길이가 달라도 오류 없이 false', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('', 'a')).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('사이트 안 경로만 허용한다', () => {
    expect(safeNextPath('/rate?book=1')).toBe('/rate?book=1');
    expect(safeNextPath('https://evil.com')).toBe('/');
    expect(safeNextPath('//evil.com')).toBe('/');
    expect(safeNextPath('/\\evil.com')).toBe('/');
    expect(safeNextPath('/login')).toBe('/');
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath('')).toBe('/');
  });
});

describe('checkRateLimit', () => {
  beforeEach(resetRateLimit);
  const opt = { limit: 3, windowMs: 600_000 };
  it('한도까지 통과하고 넘으면 막는다', () => {
    for (let i = 0; i < 3; i++) expect(checkRateLimit('ip1', opt, NOW + i).ok).toBe(true);
    const r = checkRateLimit('ip1', opt, NOW + 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterMs).toBeGreaterThan(0);
  });
  it('IP마다 따로 센다', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('ip1', opt, NOW);
    expect(checkRateLimit('ip2', opt, NOW).ok).toBe(true);
  });
  it('창이 지나면 다시 허용한다', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('ip1', opt, NOW);
    expect(checkRateLimit('ip1', opt, NOW + 600_001).ok).toBe(true);
  });
});
