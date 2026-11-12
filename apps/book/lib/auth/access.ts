import 'server-only';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@me/core/auth/session';
import { SESSION_COOKIE } from './cookies';

/** 사이트 비밀번호로 로그인했는가(서명 쿠키 확인). "나는 누구" 쿠키와는 별개다. */
export async function isLoggedIn(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, process.env.SITE_PASSWORD);
}

/**
 * 읽기 전용으로 보는 게스트인가(= 로그인 안 한 사람). proxy.ts가 허용한 읽기 화면만 여기까지 온다.
 * 게스트에게는 멤버 이름을 가리고(lib/guest-mask.ts) 쓰기 화면·버튼을 숨긴다.
 */
export async function isGuest(): Promise<boolean> {
  return !(await isLoggedIn());
}
