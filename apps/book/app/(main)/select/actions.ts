'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth/member';
import { createBook, findDuplicate, readBookFields } from '@/lib/books/create';
import type { BookFormState } from '@/lib/books/form-state';
import { createAdminClient } from '@me/core/server/supabase';
import { selectExistingSchema, selectNewSchema } from '@/lib/validation/book';

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');
const TAKEN = '이미 이번 달 책이 정해졌어요';

export async function selectBook(_prev: BookFormState, formData: FormData): Promise<BookFormState> {
  const mode = str(formData.get('mode')) === 'new' ? 'new' : 'wishlist';
  const common = { selectedBy: str(formData.get('selectedBy')), reason: str(formData.get('reason')), date: str(formData.get('date')) };
  const values = { ...readBookFields(formData), ...common, bookId: str(formData.get('bookId')), mode };

  const me = await getCurrentMember();
  if (!me) redirect('/who');

  const db = createAdminClient();

  // 1) 이미 읽는 중인 책이 있으면 거절 (DB의 unique 인덱스가 동시 요청을 한 번 더 막는다)
  const { data: reading } = await db.from('books').select('id').eq('status', 'reading').limit(1);
  if (reading?.length) return { errors: { form: [TAKEN] }, values };

  // 2) 검증
  let bookId: string;
  let createdHere = false;
  let reason: string;
  let selectedBy: string;
  let date: string;

  if (mode === 'wishlist') {
    const parsed = selectExistingSchema.safeParse(values);
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
    ({ reason, selectedBy, date, bookId } = parsed.data);
    const { data: book } = await db.from('books').select('id,status').eq('id', bookId).maybeSingle();
    if (!book || book.status !== 'wishlist') return { errors: { bookId: ['위시리스트에 없는 책이에요'] }, values };
  } else {
    const parsed = selectNewSchema.safeParse(values);
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
    const { reason: r, selectedBy: s, date: d, ...book } = parsed.data;
    ({ reason, selectedBy, date } = { reason: r, selectedBy: s, date: d });
    const duplicate = await findDuplicate(db, book.isbn13, me.id);
    if (duplicate) return { duplicate, values };
    const { data: member } = await db.from('members').select('id').eq('id', selectedBy).eq('status', 'active').maybeSingle();
    if (!member) return { errors: { selectedBy: ['활동 중인 멤버를 골라 주세요'] }, values };
    const res = await createBook(db, book, { status: 'reading', selected_by: selectedBy, selection_reason: reason, recommended_by: null, recommend_reason: null });
    if (!res.ok) return { errors: { form: [res.code === '23505' ? TAKEN : '저장하지 못했어요. 잠시 뒤에 다시 해 주세요'] }, values };
    bookId = res.id;
    createdHere = true;
  }

  if (mode === 'wishlist') {
    const { data: member } = await db.from('members').select('id').eq('id', selectedBy).eq('status', 'active').maybeSingle();
    if (!member) return { errors: { selectedBy: ['활동 중인 멤버를 골라 주세요'] }, values };
    // 위시리스트 상태일 때만 바꾼다(조건부 갱신). 동시에 다른 책이 정해졌다면 unique 인덱스(23505)가 막는다.
    const { data: changed, error } = await db
      .from('books')
      .update({ status: 'reading', selected_by: selectedBy, selection_reason: reason })
      .eq('id', bookId)
      .eq('status', 'wishlist')
      .select('id');
    if (error || !changed?.length) return { errors: { form: [error?.code === '23505' ? TAKEN : '저장하지 못했어요. 다시 해 주세요'] }, values };
  }

  // 3) 다음 회차 모임. 실패하면 책을 되돌린다.
  const { data: last } = await db.from('meetings').select('number').order('number', { ascending: false }).limit(1);
  const number = (last?.[0]?.number ?? 0) + 1;
  const { error: meetingError } = await db.from('meetings').insert({ number, date, book_id: bookId });
  if (meetingError) {
    if (createdHere) await db.from('books').delete().eq('id', bookId);
    else await db.from('books').update({ status: 'wishlist', selected_by: null, selection_reason: null }).eq('id', bookId);
    return { errors: { form: ['모임을 만들지 못했어요. 다시 해 주세요'] }, values };
  }

  revalidatePath('/', 'layout');
  redirect('/?toast=selected');
}
