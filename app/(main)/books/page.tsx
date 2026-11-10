import type { Metadata } from 'next';
import Link from 'next/link';
import { BookScoreBars } from '@/components/charts/book-score-bars';
import { DisagreementBars } from '@/components/charts/disagreement-bars';
import { Cover } from '@/components/cover';
import { Card, Section } from '@/components/section';
import { bookMemberScores, disagreementRows } from '@/lib/chart-data';
import { fmtScore } from '@/lib/format';
import { bookAverage, disagreementByBook } from '@/lib/stats';
import { getView } from '@/lib/view';

export const metadata: Metadata = { title: '책장 · 독서 모임' };

type Sort = 'latest' | 'rating' | 'gap';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'rating', label: '평점순' },
  { value: 'gap', label: '의견 차이순' },
];

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ sort?: string; genre?: string; by?: string }> }) {
  const q = await searchParams;
  const sort: Sort = SORTS.some((x) => x.value === q.sort) ? (q.sort as Sort) : 'latest';
  const { data, s, memberById, meetingOfBook } = await getView();

  const done = data.books.filter((b) => b.status === 'done');
  const genres = [...new Set(done.map((b) => b.genre).filter((g): g is string => !!g))].sort();
  const selectors = data.members.filter((m) => done.some((b) => b.selected_by === m.id));
  const genre = q.genre && genres.includes(q.genre) ? q.genre : '';
  const by = q.by && selectors.some((m) => m.id === q.by) ? q.by : '';

  const gap = new Map(disagreementByBook(s.ratings).map((d) => [d.bookId, d.stddev]));
  const rows = done
    .filter((b) => (!genre || b.genre === genre) && (!by || b.selected_by === by))
    .map((b) => ({ b, date: meetingOfBook(b.id)?.date ?? '', ...bookAverage(s.ratings, b.id), gap: gap.get(b.id) ?? null }));
  rows.sort((x, y) => {
    if (sort === 'rating') return (y.avg ?? -1) - (x.avg ?? -1);
    if (sort === 'gap') return (y.gap ?? -1) - (x.gap ?? -1);
    return y.date.localeCompare(x.date);
  });

  const active = data.members.filter((m) => m.status === 'active');
  const bars = s.books
    .filter((b) => b.status === 'done' && bookAverage(s.ratings, b.id).n > 0)
    .map((b) => ({
      bookId: b.id,
      title: b.title,
      avg: bookAverage(s.ratings, b.id).avg,
      scores: bookMemberScores(b.id, s.members, s.ratings).map((x) => ({ ...x, color: memberById.get(x.memberId)?.color ?? '#888' })),
    }));

  const select = 'min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base';
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-bold">책장</h1>

      <form method="get" className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-sm">
          <span className="mb-1 block text-muted">정렬</span>
          <select name="sort" defaultValue={sort} className={select}>
            {SORTS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">장르</span>
          <select name="genre" defaultValue={genre} className={select}>
            <option value="">전체</option>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">선정자</span>
          <select name="by" defaultValue={by} className={select}>
            <option value="">전체</option>
            {selectors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="col-span-2 min-h-12 rounded-xl bg-accent font-semibold text-accent-ink">
          적용
        </button>
      </form>

      {rows.length === 0 ? (
        <Card className="text-center text-muted">{done.length === 0 ? '아직 읽은 책이 없어요' : '조건에 맞는 책이 없어요'}</Card>
      ) : (
        <ul className="grid grid-cols-3 gap-3">
          {rows.map(({ b, avg, n }) => (
            <li key={b.id}>
              <Link href={`/books/${b.id}`} className="block">
                <Cover title={b.title} authors={b.authors} genre={b.genre} coverPath={b.cover_path} />
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{b.title}</p>
                <p className="text-xs text-muted tabular-nums">
                  <span aria-hidden className="text-star">★</span> {fmtScore(avg)}
                  {n > 0 && ` (${n})`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Section title="책별 멤버 별점">
        <Card>
          <BookScoreBars rows={bars} members={active} />
        </Card>
      </Section>

      <Section title="의견이 가장 갈린 책">
        <Card>
          <DisagreementBars rows={disagreementRows(s.books, s.ratings)} />
        </Card>
      </Section>
    </div>
  );
}
