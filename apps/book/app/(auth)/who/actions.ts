'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { COOKIE_BASE } from '@me/core/auth/cookie';
import { safeNextPath } from '@me/core/auth/redirect';
import { MEMBER_COOKIE } from '@/lib/auth/cookies';
import { isLoggedIn } from '@/lib/auth/access';
import { getClubData } from '@/lib/data';

const schema = z.object({ memberId: z.string().uuid(), next: z.string().optional() });

export async function chooseMember(formData: FormData): Promise<void> {
  // 게스트(읽기 전용)가 "누구" 쿠키를 만들지 못하게: 로그인한 사람만
  if (!(await isLoggedIn())) redirect('/login');
  const parsed = schema.safeParse({ memberId: formData.get('memberId'), next: formData.get('next') ?? undefined });
  if (!parsed.success) redirect('/who');

  const { members } = await getClubData();
  const member = members.find((m) => m.id === parsed.data.memberId && m.status === 'active');
  if (!member) redirect('/who');

  (await cookies()).set(MEMBER_COOKIE, member.id, { ...COOKIE_BASE, maxAge: 365 * 24 * 60 * 60 });
  redirect(safeNextPath(parsed.data.next));
}
