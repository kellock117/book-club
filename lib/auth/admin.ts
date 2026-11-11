import 'server-only';
import { cookies } from 'next/headers';
import { createSessionToken, verifySessionToken } from './session';

export const ADMIN_COOKIE = 'club_admin';
export const ADMIN_MAX_AGE_SEC = 12 * 60 * 60; // 12시간

/** 서명 키를 사이트 비밀번호와 갈라 두어, 두 비밀번호가 같아도 쿠키를 서로 쓸 수 없게 한다. */
const key = (pw: string) => `admin:${pw}`;

export function createAdminToken(adminPassword: string): string {
  return createSessionToken(key(adminPassword));
}

/** 관리자 쿠키가 유효한가. 페이지뿐 아니라 모든 관리 액션이 다시 확인한다. */
export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value, key(pw));
}
