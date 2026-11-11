import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar } from '@/components/avatar';
import { Cover } from '@/components/cover';
import { Card } from '@me/ui/section';
import { fmtDate, fmtDday, fmtScore } from '@/lib/format';
import { bookAverage, daysBetween } from '@/lib/stats';
import { getView } from '@/lib/view';

export const metadata: Metadata = { title: '모임 기록 · 독서 모임' };

export default async function MeetingsPage() {
  const { data, s, today, memberById, bookById } = await getView();
  const list = [...data.meetings].sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">모임 기록</h1>
      {list.length === 0 ? (
        <Card className="text-center text-muted">아직 모임 기록이 없어요</Card>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-line pl-5">
          {list.map((m) => {
            const book = m.book_id ? bookById.get(m.book_id) : undefined;
            const upcoming = m.date >= today;
            const who = data.attendees.filter((a) => a.meeting_id === m.id).map((a) => memberById.get(a.member_id)).filter((x): x is NonNullable<typeof x> => !!x);
            const avg = m.book_id ? bookAverage(s.ratings, m.book_id).avg : null;
            return (
              <li key={m.id} className="relative">
                <span aria-hidden className={`absolute -left-[1.72rem] top-5 size-3 rounded-full border-2 border-paper ${upcoming ? 'bg-accent' : 'bg-line'}`} />
                <div className={`flex gap-3 rounded-2xl border bg-surface p-3 ${upcoming ? 'border-accent border-2' : 'border-line'}`}>
                  <div className="w-16 shrink-0">
                    {book ? (
                      <Link href={`/books/${book.id}`}>
                        <Cover title={book.title} authors={book.authors} genre={book.genre} coverPath={book.cover_path} />
                      </Link>
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center rounded-md border border-dashed border-line text-[11px] text-muted">책 미정</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-serif text-lg font-bold">{m.number}회</span>
                      {upcoming && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">다가오는 모임 · {fmtDday(daysBetween(today, m.date))}</span>}
                    </p>
                    <p className="text-sm text-muted">
                      {fmtDate(m.date)}
                      {m.place ? ` · ${m.place}` : ''}
                    </p>
                    {book && (
                      <Link href={`/books/${book.id}`} className="block truncate font-medium underline-offset-2 hover:underline">
                        {book.title}
                      </Link>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <ul className="flex -space-x-1" aria-label={who.length ? `참석자 ${who.map((w) => w.name).join(', ')}` : '참석자 기록 없음'}>
                        {who.map((w) => (
                          <li key={w.id}>
                            <Avatar id={w.id} name={w.name} color={w.color} />
                          </li>
                        ))}
                      </ul>
                      {!upcoming && <span className="text-sm tabular-nums"><span aria-hidden className="text-star">★</span> {fmtScore(avg)}</span>}
                    </div>
                    <Link href={`/meetings/${m.id}/edit`} className="inline-flex min-h-11 items-center text-sm font-medium text-muted underline underline-offset-2">
                      기록하기
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {!list.some((m) => m.date >= today) && <p className="text-center text-sm text-muted">다음 모임 날짜가 아직 없어요</p>}
    </div>
  );
}
