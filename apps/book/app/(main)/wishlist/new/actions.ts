'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth/member';
import { createBook, findDuplicate, readBookFields } from '@/lib/books/create';
import type { BookFormState } from '@/lib/books/form-state';
import { createAdminClient } from '@me/core/server/supabase';
import { recommendSchema } from '@/lib/validation/book';

export async function recommendBook(_prev: BookFormState, formData: FormData): Promise<BookFormState> {
  const values = { ...readBookFields(formData), reason: typeof formData.get('reason') === 'string' ? (formData.get('reason') as string) : '' };
  const me = await getCurrentMember();
  if (!me) redirect('/who');

  const parsed = recommendSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const { reason, ...book } = parsed.data;

  const db = createAdminClient();
  const duplicate = await findDuplicate(db, book.isbn13, me.id);
  if (duplicate) return { duplicate, values };

  const res = await createBook(db, book, { status: 'wishlist', recommended_by: me.id, recommend_reason: reason, selected_by: null, selection_reason: null });
  if (!res.ok) {
    // 동시에 같은 책이 들어간 경우(ISBN unique)
    if (res.code === '23505') {
      const dup = await findDuplicate(db, book.isbn13, me.id);
      if (dup) return { duplicate: dup, values };
    }
    return { errors: { form: ['저장하지 못했어요. 잠시 뒤에 다시 해 주세요'] }, values };
  }
  revalidatePath('/', 'layout');
  redirect('/wishlist?toast=recommended');
}
