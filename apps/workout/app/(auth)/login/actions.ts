'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit } from '@me/core/auth/rate-limit';
import { COOKIE_BASE } from '@me/core/auth/cookie';
import { safeNextPath } from '@me/core/auth/redirect';
import { safeEqual, SESSION_MAX_AGE_SEC } from '@me/core/auth/session';
import { createSiteToken, siteCookieName } from '@me/core/auth/site-lock';
import type { LoginState } from '@me/ui/login-form';
import { APP_ID, PASSWORD_ENV } from '@/lib/site';

const schema = z.object({
  password: z.string().min(1, '비밀번호를 입력해 주세요'),
  next: z.string().optional(),
});

/** 비밀번호를 확인하고, 맞으면 이 앱 전용 쿠키를 심은 뒤 원래 가려던 곳으로 보낸다. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ password: formData.get('password') ?? '', next: formData.get('next') ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력을 확인해 주세요' };

  // IP당 10분에 10회 (인스턴스별로 따로 센다: docs/NOTES.md)
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const limit = checkRateLimit(`login:${APP_ID}:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return { error: `시도가 너무 많아요. ${Math.ceil(limit.retryAfterMs / 60000)}분 뒤에 다시 해 주세요` };

  const secret = process.env[PASSWORD_ENV];
  if (!secret) return { error: '서버 설정이 아직 끝나지 않았어요 (WORKOUT_PASSWORD)' };
  if (!safeEqual(parsed.data.password, secret)) return { error: '비밀번호가 맞지 않아요' };

  (await cookies()).set(siteCookieName(APP_ID), createSiteToken(APP_ID, secret), { ...COOKIE_BASE, maxAge: SESSION_MAX_AGE_SEC });
  redirect(safeNextPath(parsed.data.next));
}
