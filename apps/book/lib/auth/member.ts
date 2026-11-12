import 'server-only';
import { cookies } from 'next/headers';
import { getClubData } from '@/lib/data';
import { isLoggedIn } from './access';
import { MEMBER_COOKIE } from './cookies';

/**
 * "나는 누구" 쿠키의 멤버. 인증이 아니라 편의 기능이다(친구끼리 쓰는 사이트).
 * 쿠키가 없거나 지금 활동 중인 멤버가 아니면 null.
 * 사이트 로그인(서명 쿠키)이 없으면 항상 null이다. "누구" 쿠키는 값(멤버 id)만 알면 만들 수 있어서,
 * 게스트가 그 값을 흉내 내 쓰기 액션을 부르는 것을 여기서 막는다. 모든 쓰기 액션이 이 함수를 거친다.
 */
export async function getCurrentMember() {
  if (!(await isLoggedIn())) return null;
  const id = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!id) return null;
  const { members } = await getClubData();
  return members.find((m) => m.id === id && m.status === 'active') ?? null;
}

