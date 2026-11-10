import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'club_session';
export const MEMBER_COOKIE = 'club_member';
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30일

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(exp: number, secret: string): string {
  return b64url(createHmac('sha256', secret).update(`v1.${exp}`).digest());
}

/**
 * 서명된 세션 토큰 `만료(초).서명`. 서명 키는 SITE_PASSWORD라서
 * 비밀번호를 바꾸면 기존 로그인이 모두 무효가 된다.
 */
export function createSessionToken(secret: string, now: number = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE_SEC;
  return `${exp}.${sign(exp, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string | undefined, now: number = Date.now()): boolean {
  if (!token || !secret) return false;
  const [expStr, sig, ...rest] = token.split('.');
  if (!expStr || !sig || rest.length > 0 || !/^\d+$/.test(expStr)) return false;
  const exp = Number(expStr);
  if (exp <= Math.floor(now / 1000)) return false;
  const expected = Buffer.from(sign(exp, secret));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** 길이가 달라도 시간 차이가 나지 않게 해시끼리 비교한다. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
