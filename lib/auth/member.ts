import 'server-only';
import { cookies } from 'next/headers';
import { getClubData } from '@/lib/data';
import { MEMBER_COOKIE } from './session';

/**
 * "나는 누구" 쿠키의 멤버. 인증이 아니라 편의 기능이다(친구끼리 쓰는 사이트).
 * 쿠키가 없거나 지금 활동 중인 멤버가 아니면 null.
 */
export async function getCurrentMember() {
  const id = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!id) return null;
  const { members } = await getClubData();
  return members.find((m) => m.id === id && m.status === 'active') ?? null;
}

export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
