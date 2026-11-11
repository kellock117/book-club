'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ADMIN_COOKIE, ADMIN_MAX_AGE_SEC, createAdminToken, isAdmin } from '@/lib/auth/admin';
import { COOKIE_BASE } from '@me/core/auth/cookie';
import { checkRateLimit } from '@me/core/auth/rate-limit';
import { safeEqual } from '@me/core/auth/session';
import { createAdminClient } from '@me/core/server/supabase';
import { bookEditSchema, idSchema, memberSchema } from '@/lib/validation/admin';

export type FormState = { errors?: Record<string, string[]>; ok?: boolean; values?: Record<string, string> };

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');
const fields = (fd: FormData, names: string[]) => Object.fromEntries(names.map((n) => [n, str(fd.get(n))]));
const done = () => revalidatePath('/', 'layout');

/** 모든 관리 액션의 첫 줄. 페이지가 잠겨 있어도 액션은 따로 호출될 수 있어서 다시 확인한다. */
async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin');
}

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = str(formData.get('password'));
  if (!password) return { errors: { password: ['비밀번호를 입력해 주세요'] } };

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const limit = checkRateLimit(`admin:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return { errors: { password: [`시도가 너무 많아요. ${Math.ceil(limit.retryAfterMs / 60000)}분 뒤에 다시 해 주세요`] } };

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return { errors: { password: ['ADMIN_PASSWORD가 설정되지 않았어요'] } };
  if (!safeEqual(password, secret)) return { errors: { password: ['비밀번호가 맞지 않아요'] } };

  (await cookies()).set(ADMIN_COOKIE, createAdminToken(secret), { ...COOKIE_BASE, maxAge: ADMIN_MAX_AGE_SEC });
  redirect('/admin');
}

export async function adminLogout(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect('/admin');
}

function dbError(message: string): FormState {
  if (message.includes('members_name_key') || message.includes('duplicate key')) return { errors: { form: ['이미 있는 이름이에요'] } };
  return { errors: { form: ['저장하지 못했어요. 잠시 뒤에 다시 해 주세요'] } };
}

/** 멤버 추가(id 없음) 또는 수정(id 있음) */
export async function saveMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = fields(formData, ['name', 'rotationOrder', 'color', 'status']);
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const { name, rotationOrder, color, status } = parsed.data;

  const id = str(formData.get('id'));
  const db = createAdminClient();
  const row = { name, rotation_order: rotationOrder, color, status };
  const { error } = id ? await db.from('members').update(row).eq('id', idSchema.parse(id)) : await db.from('members').insert(row);
  if (error) return { ...dbError(error.message), values };
  done();
  return { ok: true, values: id ? values : { name: '', rotationOrder: '', color: '#8b5e3c', status: 'active' } };
}

export async function saveBook(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = fields(formData, ['id', 'title', 'authors', 'translators', 'publisher', 'pages', 'genre', 'description']);
  const parsed = bookEditSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const { id, ...rest } = parsed.data;

  const { error } = await createAdminClient().from('books').update(rest).eq('id', id);
  if (error) return { ...dbError(error.message), values };
  done();
  return { ok: true, values };
}

type Target = 'books' | 'meetings' | 'ratings';
const BLOCKED: Record<string, string> = {
  books: '이 책에 연결된 모임이 있어서 지울 수 없어요. 모임을 먼저 지워 주세요',
};

async function remove(table: Target, formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = idSchema.safeParse(formData.get('id'));
  if (!parsed.success) redirect('/admin?error=대상을 찾을 수 없어요');
  const { error } = await createAdminClient().from(table).delete().eq('id', parsed.data);
  if (error) {
    const fk = error.code === '23503';
    redirect(`/admin?error=${encodeURIComponent(fk ? (BLOCKED[table] ?? '다른 데이터가 연결되어 있어요') : '지우지 못했어요')}`);
  }
  done();
  redirect('/admin?toast=deleted');
}

export async function deleteBook(formData: FormData) {
  return remove('books', formData);
}
export async function deleteMeeting(formData: FormData) {
  return remove('meetings', formData);
}
export async function deleteRating(formData: FormData) {
  return remove('ratings', formData);
}
