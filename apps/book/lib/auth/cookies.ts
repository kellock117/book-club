/**
 * 독서 모임 사이트가 쓰는 쿠키 이름.
 * - club_session: 사이트 비밀번호로 로그인했다는 서명 토큰(만료 30일). 만들고 검증하는 도구는 @me/core/auth/session.
 * - club_member: "나는 누구"로 고른 멤버 id. 인증이 아니라 편의 기능이다.
 * (관리자 쿠키 이름은 lib/auth/admin.ts에 있다.)
 */
export const SESSION_COOKIE = 'club_session';
export const MEMBER_COOKIE = 'club_member';
