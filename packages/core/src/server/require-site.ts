/**
 * 앱 잠금 확인(서버 전용). 레이아웃과 "모든" 서버 액션의 첫 줄에서 부른다.
 *
 * proxy.ts가 1차로 막지만, 서버 액션은 주소로 직접 호출될 수 있어서 액션 안에서도 다시 확인한다.
 * 잠겨 있으면 그 앱의 로그인 화면으로 보낸다.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { siteCookieName, verifySiteToken } from '../auth/site-lock';

/**
 * @param appId 앱 id (예: 'workout')
 * @param passwordEnv 비밀번호가 들어 있는 환경 변수 이름 (예: 'WORKOUT_PASSWORD')
 */
export async function requireSite(appId: string, passwordEnv: string): Promise<void> {
  const token = (await cookies()).get(siteCookieName(appId))?.value;
  if (!verifySiteToken(appId, token, process.env[passwordEnv])) redirect('/login');
}
