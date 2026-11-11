import type { Metadata } from 'next';
import { getCurrentMember } from '@/lib/auth/member';
import { getClubData } from '@/lib/data';
import { latestUnratedBook } from '@/lib/stats';
import { toStats } from '@/lib/to-stats';
import { RatingForm } from './rating-form';

export const metadata: Metadata = { title: '평점 남기기 · 독서 모임' };

export default async function RatePage({ searchParams }: { searchParams: Promise<{ book?: string }> }) {
  const me = (await getCurrentMember())!;
  const { book: bookParam } = await searchParams;
  const data = await getClubData();
  const s = toStats(data);

  const doneBooks = data.books.filter((b) => b.status === 'done');
  if (doneBooks.length === 0) {
    return <p className="py-16 text-center text-muted">아직 평점을 남길 책이 없어요.</p>;
  }

  // 기본값: 내가 아직 평점을 안 남긴 가장 최근 책. 다 남겼다면 가장 최근 책을 고치기 모드로 연다.
  const requested = doneBooks.find((b) => b.id === bookParam)?.id;
  const defaultId = latestUnratedBook(s.books, s.meetings, s.ratings, me.id);
  const newestDone = [...doneBooks]
    .map((b) => ({ id: b.id, date: s.meetings.filter((m) => m.bookId === b.id).map((m) => m.date).sort().at(-1) ?? '' }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0]!.id;
  const bookId = requested ?? defaultId ?? newestDone;
  const book = doneBooks.find((b) => b.id === bookId)!;

  const mine = new Set(data.ratings.filter((r) => r.member_id === me.id).map((r) => r.book_id));
  const options = doneBooks.map((b) => ({ id: b.id, title: b.title, rated: mine.has(b.id) }));
  const mineForBook = data.ratings.find((r) => r.book_id === bookId && r.member_id === me.id);
  const existing = mineForBook
    ? { score: Number(mineForBook.score), oneLiner: mineForBook.one_liner ?? '', quote: mineForBook.quote ?? '' }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">평점 남기기</h1>
        <p className="mt-1 text-muted">
          {book.title}
          {book.authors.length ? ` · ${book.authors.join(', ')}` : ''}
        </p>
      </div>
      {/* 책이 바뀌면 폼 상태도 새로 시작한다 */}
      <RatingForm key={bookId} bookId={bookId} books={options} existing={existing} />
    </div>
  );
}
