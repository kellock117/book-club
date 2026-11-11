/**
 * 서명된 세션 토큰 (로그인 쿠키의 값).
 *
 * 형식은 `만료(초).서명`이다. 서명은 HMAC-SHA256이고, 서명 키는 호출하는 쪽이 정한다.
 * 보통 "그 사이트의 비밀번호"를 키로 쓰기 때문에 비밀번호를 바꾸면 기존 로그인이 모두 무효가 된다.
 *
 * 누가 쓰나: 독서 모임의 사이트 잠금·관리자 잠금(apps/book), 앱별 잠금 `site-lock.ts`.
 * 주의: Node의 `node:crypto`를 쓴다. Next의 proxy.ts(Node 런타임)에서는 되지만 Edge 런타임에서는 안 된다.
 */
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

/** 한 번 로그인하면 유지되는 기간. 30일. */
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;

const b64url = (buf: Buffer) => buf.toString('base64url');

/** 만료 시각을 서명한다. "v1." 접두사는 나중에 형식을 바꿀 때 구분하려는 것이다. */
function sign(exp: number, secret: string): string {
  return b64url(createHmac('sha256', secret).update(`v1.${exp}`).digest());
}

/**
 * 토큰을 만든다.
 * @param secret 서명 키(보통 비밀번호 기반)
 * @param now 테스트에서 시각을 고정하려고 받는다. 평소에는 생략한다.
 */
export function createSessionToken(secret: string, now: number = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE_SEC;
  return `${exp}.${sign(exp, secret)}`;
}

/**
 * 토큰이 유효한지 본다. 토큰이나 키가 없으면 항상 false다(안전한 쪽으로 실패).
 * 서명 비교는 시간 차이로 정보가 새지 않게 `timingSafeEqual`로 한다.
 */
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

/** 문자열이 같은지 비교한다. 길이가 달라도 시간 차이가 나지 않게 해시끼리 비교한다. 비밀번호 비교에 쓴다. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
