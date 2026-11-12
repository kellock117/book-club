/**
 * 앱 잠금 확인(서버 전용). 레이아웃과 "모든" 서버 액션의 첫 줄에서 부른다.
 *
 * proxy.ts가 1차로 막지만, 서버 액션은 주소로 직접 호출될 수 있어서 액션 안에서도 다시 확인한다.
 * 잠겨 있으면 그 앱의 로그인 화면으로 보낸다.
 *
 * 읽기 전용 공개(게스트 모드)에서는 화면은 게스트에게도 열리지만, 이 함수는 게스트를 계속 막는다.
 * 그래서 "쓰기 액션 = requireSite()"라는 규칙만 지키면 게스트는 아무것도 바꿀 수 없다.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { siteCookieName, verifySiteToken } from '../auth/site-lock';

/** 로그인했는가(리다이렉트 없이 true/false). 게스트 화면을 가르는 데 쓴다. */
export async function isSiteLoggedIn(appId: string, passwordEnv: string): Promise<boolean> {
  const token = (await cookies()).get(siteCookieName(appId))?.value;
  return verifySiteToken(appId, token, process.env[passwordEnv]);
}

/**
 * @param appId 앱 id (예: 'workout')
 * @param passwordEnv 비밀번호가 들어 있는 환경 변수 이름 (예: 'WORKOUT_PASSWORD')
 */
export async function requireSite(appId: string, passwordEnv: string): Promise<void> {
  if (!(await isSiteLoggedIn(appId, passwordEnv))) redirect('/login');
}
