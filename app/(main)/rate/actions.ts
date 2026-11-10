'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth/member';
import { CLUB_TAG } from '@/lib/data';
import { createAdminClient } from '@/lib/supabase/admin';
import { ratingInputSchema } from '@/lib/validation/rating';

export type RateState = {
  errors?: Partial<Record<'bookId' | 'score' | 'oneLiner' | 'quote' | 'form', string[]>>;
  /** 실패했을 때 입력값을 그대로 돌려 준다 */
  values?: { score: string; oneLiner: string; quote: string };
};

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');

export async function saveRating(_prev: RateState, formData: FormData): Promise<RateState> {
  const values = { score: str(formData.get('score')), oneLiner: str(formData.get('oneLiner')), quote: str(formData.get('quote')) };

  const me = await getCurrentMember();
  if (!me) redirect('/who');

  const parsed = ratingInputSchema.safeParse({ bookId: str(formData.get('bookId')), ...values });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const input = parsed.data;

  const db = createAdminClient();

  // 캐시가 아니라 DB에서 직접: 완료된 책에만 평점을 남길 수 있다
  const { data: book, error: bookErr } = await db.from('books').select('id,status').eq('id', input.bookId).maybeSingle();
  if (bookErr) return { errors: { form: ['저장하지 못했어요. 잠시 뒤에 다시 해 주세요'] }, values };
  if (!book) return { errors: { bookId: ['없는 책이에요'] }, values };
  if (book.status !== 'done') return { errors: { bookId: ['아직 모임이 끝나지 않은 책이에요'] }, values };

  // (책, 멤버)당 1개. 다시 내면 덮어쓴다
  const { error } = await db
    .from('ratings')
    .upsert(
      { book_id: input.bookId, member_id: me.id, score: input.score, one_liner: input.oneLiner, quote: input.quote },
      { onConflict: 'book_id,member_id' },
    );
  if (error) return { errors: { form: ['저장하지 못했어요. 잠시 뒤에 다시 해 주세요'] }, values };

  // Next 16: revalidateTag는 두 번째 인자가 필요하다. { expire: 0 }은 낡은 값을 보여 주지 않고 바로 새로 읽는다
  revalidateTag(CLUB_TAG, { expire: 0 });
  redirect('/?toast=rated');
}
