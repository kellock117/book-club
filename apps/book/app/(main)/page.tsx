import Link from 'next/link';
import { Avatar } from '@/components/avatar';
import { GenerosityBars } from '@/components/charts/generosity-bars';
import { GenreBar } from '@/components/charts/genre-bar';
import { Heatmap } from '@/components/charts/heatmap';
import { TrendLine } from '@/components/charts/trend-line';
import { Cover } from '@/components/cover';
import { Card, Section } from '@me/ui/section';
import { getCurrentMember } from '@/lib/auth/member';
import { generosityRows, genreShare, heatmapRows, meetingTrend } from '@/lib/chart-data';
import { fmtDate, fmtDday, fmtScore } from '@/lib/format';
import { bookAverage, latestUnratedBook, meetingCount, monthsTogether, nextMeetingDday, nextSelector, overallAverage, pendingRatings, readBookCount, totalPages } from '@/lib/stats';
import { getView } from '@/lib/view';


export default async function HomePage() {
  const me = (await getCurrentMember())!;
  const { data, s, today, memberById, bookById, colors, meetingOfBook } = await getView();

  const waiting = pendingRatings(s.books, s.members, s.ratings).filter((p) => p.missingMemberIds.includes(me.id));
  const nextBookId = latestUnratedBook(s.books, s.meetings, s.ratings, me.id);
  const reading = data.books.find((b) => b.status === 'reading');
  const selector = nextSelector(s.members, s.books, s.meetings);
  const iAmNext = selector?.id === me.id;

  const dday = nextMeetingDday(s.meetings, today);
  const upcoming = data.meetings.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const pages = totalPages(s.books.filter((b) => b.status === 'done'));
  const activeMembers = data.members.filter((m) => m.status === 'active');

  const dateOf = (b: { id: string }) => meetingOfBook(b.id)?.date ?? '';
  const heat = heatmapRows(s.books, s.members, s.ratings, dateOf);
  const trend = meetingTrend(s.meetings, s.books, s.ratings);

  const fame = s.books
    .map((b) => ({ b, ...bookAverage(s.ratings, b.id) }))
    .filter((x): x is typeof x & { avg: number } => x.avg !== null)
    .sort((a, b) => b.avg - a.avg || b.n - a.n)
    .slice(0, 3);
  const recent = [...data.ratings]
    .filter((r) => r.one_liner)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-bold">{me.name}님, 안녕하세요</h1>

      {(waiting.length > 0 || (iAmNext && !reading)) && (
        <div className="space-y-2">
          {waiting.length > 0 && (
            <Link href="/rate" className="block rounded-2xl border border-accent bg-surface p-4">
              <p className="font-semibold">아직 평점을 안 남긴 책이 {waiting.length}권 있어요</p>
              <p className="mt-1 text-sm text-muted">{bookById.get(nextBookId ?? '')?.title ?? ''}부터 남겨 볼까요? →</p>
            </Link>
          )}
          {iAmNext && !reading && (
            <Link href="/select" className="block rounded-2xl border border-accent bg-surface p-4">
              <p className="font-semibold">이번엔 {me.name}님이 책을 고를 차례예요</p>
              <p className="mt-1 text-sm text-muted">이번 달 책 정하기 →</p>
            </Link>
          )}
        </div>
      )}

      <Section title="지금 읽는 책">
        {reading ? (
          <Card className="flex gap-4">
            <Link href={`/books/${reading.id}`} className="w-24 shrink-0">
              <Cover title={reading.title} authors={reading.authors} genre={reading.genre} coverPath={reading.cover_path} />
            </Link>
            <div className="min-w-0 flex-1 space-y-1">
              <Link href={`/books/${reading.id}`} className="block font-serif text-lg font-bold leading-snug">
                {reading.title}
              </Link>
              <p className="text-sm text-muted">{reading.authors.join(', ') || '저자 정보 없음'}</p>
              <p className="text-sm text-muted">{reading.pages ? `${reading.pages}쪽` : '쪽수 미입력'} · 선정 {reading.selected_by ? memberById.get(reading.selected_by)?.name : '미지정'}</p>
              <p className="pt-1 text-sm">
                {upcoming ? (
                  <>
                    다음 모임 <strong>{fmtDate(upcoming.date)}</strong> <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">{fmtDday(dday)}</span>
                  </>
                ) : (
                  <span className="text-muted">다음 모임 날짜가 아직 없어요</span>
                )}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="space-y-3 text-center">
            <p className="font-semibold">다음 책을 골라 주세요{selector ? ` — 선정자: ${selector.name}` : ''}</p>
            <Link href="/select" className="inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-semibold text-accent-ink">
              이번 달 책 정하기
            </Link>
          </Card>
        )}
      </Section>

      <Section title="우리 모임 숫자">
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="읽은 책" value={`${readBookCount(s.books)}권`} sub={`총 ${pages.pages.toLocaleString()}쪽${pages.missingCount ? ` · ${pages.missingCount}권 미입력` : ''}`} />
          <Stat label="모임 횟수" value={`${meetingCount(s.meetings, today)}회`} />
          <Stat label="함께한 기간" value={`${monthsTogether(s.meetings, today)}개월`} />
          <Stat label="전체 평균 별점" value={fmtScore(overallAverage(s.ratings))} sub={`평점 ${s.ratings.length}개`} />
        </dl>
      </Section>

      <Section title="다음 선정자">
        <Card className="space-y-3">
          {selector ? (
            <p className="flex items-center gap-3 font-serif text-xl font-bold">
              <Avatar id={selector.id} name={selector.name} color={memberById.get(selector.id)?.color ?? '#888'} size="md" />
              {selector.name}
            </p>
          ) : (
            <p className="text-muted">활동 중인 멤버가 없어요</p>
          )}
          <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="선정 순서">
            {activeMembers.map((m, i) => (
              <li key={m.id} className="inline-flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-muted">→</span>}
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${m.id === selector?.id ? 'border-accent font-bold' : 'border-line text-muted'}`}>
                  <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <Section title="책 × 멤버 별점">
        <Card>
          <Heatmap rows={heat} members={activeMembers.map((m) => ({ id: m.id, name: m.name, color: m.color }))} />
        </Card>
      </Section>

      <Section title="모임 만족도 추이">
        <Card>
          <TrendLine points={trend.points} skipped={trend.skipped} />
        </Card>
      </Section>

      <Section title="누가 후하고 누가 짠가">
        <Card>
          <GenerosityBars rows={generosityRows(s.members, s.ratings)} colors={colors} />
        </Card>
      </Section>

      <Section title="어떤 장르를 읽었나">
        <Card>
          <GenreBar rows={genreShare(data.books)} />
        </Card>
      </Section>

      <Section title="명예의 전당">
        {fame.length === 0 ? (
          <Card className="text-center text-sm text-muted">아직 평점을 받은 책이 없어요</Card>
        ) : (
          <ol className="space-y-2">
            {fame.map(({ b, avg, n }, i) => (
              <li key={b.id}>
                <Link href={`/books/${b.id}`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2">
                  <span className="font-serif text-xl font-bold text-accent" aria-label={`${i + 1}위`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{b.title}</span>
                  <span className="text-sm tabular-nums">
                    <span className="text-star" aria-hidden>
                      ★
                    </span>{' '}
                    {fmtScore(avg)} <span className="text-muted">({n}명)</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="최근 한 줄 평">
        {recent.length === 0 ? (
          <Card className="text-center text-sm text-muted">아직 한 줄 평이 없어요</Card>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => {
              const m = memberById.get(r.member_id);
              return (
                <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                  <p>“{r.one_liner}”</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                    {m && <Avatar id={m.id} name={m.name} color={m.color} />}
                    {m?.name} · <Link href={`/books/${r.book_id}`} className="underline-offset-2 hover:underline">{bookById.get(r.book_id)?.title}</Link> · ★ {fmtScore(Number(r.score))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <p className="text-center text-sm">
        <Link href="/rules" className="inline-flex min-h-11 items-center text-muted underline underline-offset-2">
          우리의 규칙
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl font-bold tabular-nums">{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-muted">{sub}</dd>}
    </div>
  );
}
