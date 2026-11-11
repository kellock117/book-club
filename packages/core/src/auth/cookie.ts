/**
 * 로그인·선택 쿠키에 공통으로 쓰는 속성.
 * - httpOnly: 브라우저 스크립트가 못 읽는다.
 * - sameSite=lax: 다른 사이트에서 오는 POST에는 실리지 않는다.
 * - secure: 배포(production)에서만. 로컬 http에서도 동작해야 해서 개발 환경은 끈다.
 * `domain`을 지정하지 않으므로 host-only 쿠키가 된다(앱끼리 공유되지 않는다).
 */
export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
