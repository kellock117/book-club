'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { safeNextPath } from '@/lib/auth/redirect';
import { createSessionToken, safeEqual, SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '@/lib/auth/session';
import { COOKIE_BASE } from '@/lib/auth/member';

export type LoginState = { error?: string };

const schema = z.object({
  password: z.string().min(1, '비밀번호를 입력해 주세요'),
  next: z.string().optional(),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ password: formData.get('password') ?? '', next: formData.get('next') ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력을 확인해 주세요' };

  // IP당 10분에 10회
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const limit = checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return { error: `시도가 너무 많아요. ${Math.ceil(limit.retryAfterMs / 60000)}분 뒤에 다시 해 주세요` };

  const secret = process.env.SITE_PASSWORD;
  if (!secret) return { error: '서버 설정이 아직 끝나지 않았어요. 관리자에게 알려 주세요' };
  if (!safeEqual(parsed.data.password, secret)) return { error: '비밀번호가 맞지 않아요' };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(secret), { ...COOKIE_BASE, maxAge: SESSION_MAX_AGE_SEC });
  redirect(safeNextPath(parsed.data.next));
}
