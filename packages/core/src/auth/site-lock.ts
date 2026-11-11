/**
 * 앱별 잠금(사이트마다 따로 두는 비밀번호)의 "순수" 부분. Next에 의존하지 않아 proxy.ts에서도 쓴다.
 *
 * 구조
 * - 앱마다 비밀번호가 다르다(예: workout은 WORKOUT_PASSWORD).
 * - 서명 키를 `site:<앱 id>:<비밀번호>`로 만들어서, 비밀번호가 같더라도 다른 앱의 쿠키로는 통과할 수 없다.
 * - 쿠키는 Vercel 도메인(workout.<도메인> 등)마다 따로 저장되는 host-only 쿠키라서 앱끼리 공유되지도 않는다.
 *
 * 서버 액션·레이아웃에서 쓰는 `requireSite()`는 next/headers가 필요해서 `server/require-site.ts`에 따로 있다.
 */
import { createSessionToken, verifySessionToken } from './session';

/** 로그인 쿠키 이름. 예: `site_workout` */
export const siteCookieName = (appId: string): string => `site_${appId}`;

/** 앱 id와 비밀번호로 서명 키를 만든다. */
const key = (appId: string, password: string): string => `site:${appId}:${password}`;

/** 로그인에 성공했을 때 쿠키에 넣을 토큰을 만든다. */
export function createSiteToken(appId: string, password: string): string {
  return createSessionToken(key(appId, password));
}

/**
 * 쿠키의 토큰이 이 앱에서 유효한가.
 * 비밀번호가 설정되지 않았으면(환경 변수 누락) 항상 false라서 사이트가 전부 잠긴다.
 */
export function verifySiteToken(appId: string, token: string | undefined, password: string | undefined): boolean {
  if (!password) return false;
  return verifySessionToken(token, key(appId, password));
}
