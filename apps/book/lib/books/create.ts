import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@me/core/database';
import { BOOK_FIELD_NAMES } from './form-state';
import type { BookFields } from '@/lib/validation/book';
import { copyCover } from './cover';

type Db = SupabaseClient<Database>;
type BookInsert = Database['public']['Tables']['books']['Insert'];

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');

/** 책 입력 칸을 문자열 그대로 읽는다(검증은 zod가 한다). 오류 때 되돌려 줄 값으로도 쓴다. */
export function readBookFields(formData: FormData): Record<string, string> {
  return Object.fromEntries(BOOK_FIELD_NAMES.map((n) => [n, str(formData.get(n))]));
}

/** 같은 ISBN의 책이 있으면 그 책(상태)과 내가 관심을 표시했는지. */
export async function findDuplicate(db: Db, isbn13: string | null, memberId: string) {
  if (!isbn13) return null;
  const { data: book } = await db.from('books').select('id,title,status').eq('isbn13', isbn13).maybeSingle();
  if (!book) return null;
  const { data: mine } = await db.from('book_interests').select('book_id').eq('book_id', book.id).eq('member_id', memberId).maybeSingle();
  return { id: book.id, title: book.title, status: book.status as 'wishlist' | 'reading' | 'done', interested: !!mine };
}

/** 책 행을 만들고 표지를 Storage에 복사한다. 표지 복사가 실패해도 책은 저장한다(자동 표지). */
export async function createBook(db: Db, f: BookFields, extra: Pick<BookInsert, 'status' | 'recommended_by' | 'recommend_reason' | 'selected_by' | 'selection_reason'>) {
  const { data, error } = await db
    .from('books')
    .insert({
      title: f.title,
      authors: f.authors,
      translators: f.translators,
      publisher: f.publisher,
      published_date: f.publishedDate,
      isbn13: f.isbn13,
      pages: f.pages,
      genre: f.genre,
      description: f.description,
      info_source: f.infoSource,
      ...extra,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false as const, code: error?.code ?? null };
  if (f.coverUrl) {
    const path = await copyCover(db, data.id, f.coverUrl);
    if (path) await db.from('books').update({ cover_path: path }).eq('id', data.id);
  }
  return { ok: true as const, id: data.id };
}
