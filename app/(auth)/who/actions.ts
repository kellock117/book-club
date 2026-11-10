'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { COOKIE_BASE } from '@/lib/auth/member';
import { safeNextPath } from '@/lib/auth/redirect';
import { MEMBER_COOKIE } from '@/lib/auth/session';
import { getClubData } from '@/lib/data';

const schema = z.object({ memberId: z.string().uuid(), next: z.string().optional() });

export async function chooseMember(formData: FormData): Promise<void> {
  const parsed = schema.safeParse({ memberId: formData.get('memberId'), next: formData.get('next') ?? undefined });
  if (!parsed.success) redirect('/who');

  const { members } = await getClubData();
  const member = members.find((m) => m.id === parsed.data.memberId && m.status === 'active');
  if (!member) redirect('/who');

  (await cookies()).set(MEMBER_COOKIE, member.id, { ...COOKIE_BASE, maxAge: 365 * 24 * 60 * 60 });
  redirect(safeNextPath(parsed.data.next));
}
