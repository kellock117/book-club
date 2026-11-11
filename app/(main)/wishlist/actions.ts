'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth/member';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({ bookId: z.uuid('책을 찾을 수 없어요') });

/** "나도 읽고 싶어요" 토글: 있으면 지우고 없으면 넣는다. */
export async function toggleInterest(formData: FormData): Promise<void> {
  const me = await getCurrentMember();
  if (!me) return;
  const parsed = schema.safeParse({ bookId: formData.get('bookId') });
  if (!parsed.success) return;
  const db = createAdminClient();
  const { bookId } = parsed.data;

  const { data: book } = await db.from('books').select('id,status').eq('id', bookId).maybeSingle();
  if (!book || book.status !== 'wishlist') return; // 위시리스트 책에만 관심을 표시한다

  const { data: existing } = await db.from('book_interests').select('book_id').eq('book_id', bookId).eq('member_id', me.id).maybeSingle();
  if (existing) await db.from('book_interests').delete().eq('book_id', bookId).eq('member_id', me.id);
  else await db.from('book_interests').insert({ book_id: bookId, member_id: me.id });
  revalidatePath('/', 'layout'); // 브라우저 라우터 캐시를 비워 바로 새 데이터를 보여 준다
}
