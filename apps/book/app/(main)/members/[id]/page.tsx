import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/avatar';
import { TasteGrid } from '@/components/charts/taste-grid';
import { Card, Section } from '@me/ui/section';
import { tasteMatrix } from '@/lib/chart-data';
import { fmtScore } from '@/lib/format';
import { attendanceRate, generosityIndex, memberAverage } from '@/lib/stats';
import { getView } from '@/lib/view';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { memberById } = await getView();
  return { title: `${memberById.get(id)?.name ?? '멤버'} · 독서 모임` };
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { data, s, today, memberById, bookById } = await getView();
  const member = memberById.get(id);
  if (!member) notFound();

  const selected = data.books.filter((b) => b.selected_by === id);
  const att = attendanceRate(id, s.meetings, s.attendees, today);
  const avg = memberAverage(s.ratings, id);
  const gen = generosityIndex(s.ratings, id);
  const mine = data.ratings.filter((r) => r.member_id === id).map((r) => ({ ...r, score: Number(r.score), title: bookById.get(r.book_id)?.title ?? '' }));
  const top = mine.length ? mine.reduce((a, b) => (b.score > a.score ? b : a)) : null;
  const low = mine.length ? mine.reduce((a, b) => (b.score < a.score ? b : a)) : null;
  const matrix = tasteMatrix(s.members, s.ratings);
  const withLines = mine.filter((r) => r.one_liner).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const signed = gen === null ? '—' : `${gen > 0 ? '+' : ''}${gen.toFixed(2)}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} color={member.color} size="md" />
        <div>
          <h1 className="font-serif text-2xl font-bold">{member.name}</h1>
          {member.status !== 'active' && <p className="text-sm text-muted">합류 대기 중</p>}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ['참석률', att.rate === null ? '—' : `${Math.round(att.rate * 100)}%`, att.eligible ? `${att.attended}/${att.eligible}회` : ''],
          ['평균 별점', fmtScore(avg), `${mine.length}개`],
          ['후함 지수', signed, gen === null ? '비교할 평점 없음' : gen > 0 ? '후한 편' : gen < 0 ? '짠 편' : '평균과 같음'],
        ].map(([k, v, sub]) => (
          <div key={k} className="rounded-2xl border border-line bg-surface p-3">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-1 font-serif text-xl font-bold tabular-nums">{v}</dd>
            <dd className="text-[11px] text-muted">{sub}</dd>
          </div>
        ))}
      </dl>

      <Section title="가장 높게 / 낮게 준 책">
        {top && low ? (
          <Card className="space-y-2 text-sm">
            <p>
              <span className="text-muted">가장 높게</span>{' '}
              <Link href={`/books/${top.book_id}`} className="font-medium underline-offset-2 hover:underline">{top.title}</Link> ★ {fmtScore(top.score)}
            </p>
            <p>
              <span className="text-muted">가장 낮게</span>{' '}
              <Link href={`/books/${low.book_id}`} className="font-medium underline-offset-2 hover:underline">{low.title}</Link> ★ {fmtScore(low.score)}
            </p>
          </Card>
        ) : (
          <Card className="text-center text-sm text-muted">아직 남긴 평점이 없어요</Card>
        )}
      </Section>

      <Section title="선정한 책">
        {selected.length === 0 ? (
          <Card className="text-center text-sm text-muted">아직 선정한 책이 없어요</Card>
        ) : (
          <ul className="space-y-2">
            {selected.map((b) => (
              <li key={b.id}>
                <Link href={`/books/${b.id}`} className="flex min-h-12 items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-2">
                  <span className="truncate font-medium">{b.title}</span>
                  <span className="shrink-0 text-xs text-muted">{b.status === 'done' ? '읽음' : b.status === 'reading' ? '읽는 중' : '위시'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="멤버와의 취향 거리">
        <Card>
          <TasteGrid members={matrix.members.map((m) => ({ id: m.id, name: m.name, color: memberById.get(m.id)?.color ?? '#888' }))} cells={matrix.cells} highlightId={id} />
        </Card>
      </Section>

      <Section title="남긴 한 줄 평">
        {withLines.length === 0 ? (
          <Card className="text-center text-sm text-muted">아직 한 줄 평이 없어요</Card>
        ) : (
          <ul className="space-y-2">
            {withLines.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                <p>“{r.one_liner}”</p>
                <p className="mt-1 text-sm text-muted">
                  <Link href={`/books/${r.book_id}`} className="underline-offset-2 hover:underline">{r.title}</Link> · ★ {fmtScore(r.score)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
