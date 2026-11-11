import { createInterface } from 'node:readline/promises';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@me/core/database';
import { lookupAladin, searchAladin } from '../../lib/book-api/aladin';
import type { BookCandidate } from '../../lib/book-api/types';

type Db = SupabaseClient<Database>;

async function pick(title: string, authors: string[], candidates: BookCandidate[]): Promise<BookCandidate | null> {
  const withIsbn = candidates.filter((c) => c.isbn13);
  if (withIsbn.length === 0) return null;
  // 제목이 정확히 같은 후보가 하나뿐이면 자동으로 고른다
  const exact = withIsbn.filter((c) => c.title === title);
  if (exact.length === 1) return exact[0]!;

  if (!process.stdin.isTTY) {
    console.warn(`  후보가 여럿이라 건너뜀(대화형 터미널에서 실행하면 고를 수 있음): ${title}`);
    return null;
  }
  console.log(`\n"${title}" (${authors.join(', ')}) 후보:`);
  withIsbn.forEach((c, i) =>
    console.log(`  ${i + 1}) ${c.title} / ${c.authors.join(', ')} / ${c.publisher ?? '-'} / ${c.publishedDate?.slice(0, 4) ?? '-'} / ${c.isbn13}`),
  );
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question('번호 입력 (0 = 건너뛰기): ')).trim();
    const n = Number.parseInt(answer, 10);
    return Number.isInteger(n) && n >= 1 && n <= withIsbn.length ? withIsbn[n - 1]! : null;
  } finally {
    rl.close();
  }
}

async function copyCover(db: Db, bookId: string, coverUrl: string): Promise<string | null> {
  const res = await fetch(coverUrl);
  if (!res.ok) throw new Error(`표지 다운로드 HTTP ${res.status}`);
  const path = `${bookId}.jpg`;
  const { error } = await db.storage.from('covers').upload(path, await res.arrayBuffer(), { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`표지 업로드: ${error.message}`);
  return path;
}

/** ISBN이 없는 책마다 알라딘에서 제목+저자로 검색해 ISBN·쪽수·표지 등을 채운다. 이미 채워진 책은 건드리지 않는다. */
export async function enrichBooks(db: Db, ttbKey: string): Promise<{ enriched: number; skipped: string[] }> {
  const { data: books, error } = await db.from('books').select('id,title,authors,pages,cover_path').is('isbn13', null);
  if (error) throw new Error(`books 조회: ${error.message}`);
  let enriched = 0;
  const skipped: string[] = [];

  for (const b of books ?? []) {
    try {
      const found = await searchAladin(ttbKey, `${b.title} ${b.authors[0] ?? ''}`.trim());
      const chosen = await pick(b.title, b.authors, found);
      if (!chosen?.isbn13) {
        skipped.push(b.title);
        continue;
      }
      const detail = (await lookupAladin(ttbKey, chosen.isbn13)) ?? chosen;
      let coverPath = b.cover_path;
      const coverUrl = detail.coverUrl ?? chosen.coverUrl;
      if (!coverPath && coverUrl) {
        try {
          coverPath = await copyCover(db, b.id, coverUrl);
        } catch (e) {
          console.warn(`  표지 복사 실패(자동 표지로 대체): ${b.title} — ${(e as Error).message}`);
        }
      }
      const { error: upErr } = await db
        .from('books')
        .update({
          isbn13: chosen.isbn13,
          pages: b.pages ?? detail.pages ?? chosen.pages,
          publisher: detail.publisher ?? chosen.publisher,
          published_date: detail.publishedDate ?? chosen.publishedDate,
          description: detail.description ?? chosen.description,
          source_category: detail.categoryName ?? chosen.categoryName,
          translators: detail.translators.length ? detail.translators : chosen.translators,
          cover_path: coverPath,
          info_source: 'aladin',
        })
        .eq('id', b.id);
      if (upErr) throw new Error(upErr.message);
      enriched++;
      console.log(`  보강: ${b.title} → ${chosen.isbn13} (${detail.pages ?? '쪽수 없음'}쪽)`);
    } catch (e) {
      console.warn(`  보강 실패: ${b.title} — ${(e as Error).message}`);
      skipped.push(b.title);
    }
  }
  return { enriched, skipped };
}
