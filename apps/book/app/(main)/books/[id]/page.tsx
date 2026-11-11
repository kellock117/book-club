import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/avatar';
import { BookScoreBars } from '@/components/charts/book-score-bars';
import { Cover } from '@/components/cover';
import { Card, Section } from '@me/ui/section';
import { getCurrentMember } from '@/lib/auth/member';
import { bookMemberScores } from '@/lib/chart-data';
import { fmtDate, fmtScore } from '@/lib/format';
import { bookAverage, pendingRatings } from '@/lib/stats';
import { getView } from '@/lib/view';

const STATUS: Record<string, string> = { done: '읽은 책', reading: '읽는 중', wishlist: '위시리스트' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { bookById } = await getView();
  return { title: `${bookById.get(id)?.title ?? '책'} · 독서 모임` };
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const me = (await getCurrentMember())!;
  const { data, s, memberById, meetingOfBook } = await getView();
  const book = data.books.find((b) => b.id === id);
  if (!book) notFound();

  const meeting = meetingOfBook(book.id);
  const { avg, n } = bookAverage(s.ratings, book.id);
  const ratings = data.ratings.filter((r) => r.book_id === book.id);
  const myRating = ratings.find((r) => r.member_id === me.id);
  const missing = book.status === 'done' ? (pendingRatings(s.books, s.members, s.ratings).find((p) => p.bookId === book.id)?.missingMemberIds ?? []) : [];
  const interested = data.interests.filter((i) => i.book_id === book.id).length;
  const members = data.members.filter((m) => m.status === 'active');
  const scores = bookMemberScores(book.id, s.members, s.ratings).map((x) => ({ ...x, color: memberById.get(x.memberId)?.color ?? '#888' }));
  const selector = book.selected_by ? memberById.get(book.selected_by) : null;
  const recommender = book.recommended_by ? memberById.get(book.recommended_by) : null;

  return (
    <article className="space-y-8">
      <div className="flex gap-4">
        <div className="w-28 shrink-0">
          <Cover title={book.title} authors={book.authors} genre={book.genre} coverPath={book.cover_path} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs font-medium text-accent">{STATUS[book.status] ?? book.status}</p>
          <h1 className="font-serif text-2xl font-bold leading-snug">{book.title}</h1>
          <p className="text-sm text-muted">{book.authors.join(', ') || '저자 정보 없음'}</p>
          <p className="text-sm text-muted">
            {book.pages ? `${book.pages}쪽` : '쪽수 미입력'} · {book.genre ?? '장르 미분류'}
          </p>
          {book.status === 'done' && (
            <p className="pt-1 text-lg font-bold tabular-nums">
              <span aria-hidden className="text-star">★</span> {fmtScore(avg)} <span className="text-sm font-normal text-muted">{n > 0 ? `(${n}명)` : '평점 없음'}</span>
            </p>
          )}
        </div>
      </div>

      {book.status === 'done' && (
        <Link href={`/rate?book=${book.id}`} className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-ink">
          {myRating ? '내 평점 고치기' : '내 평점 남기기'}
        </Link>
      )}

      <Section title="모임 정보">
        <Card className="space-y-1.5 text-sm">
          <p>
            <span className="text-muted">선정자</span> {selector?.name ?? '미지정'}
            {recommender && <span className="text-muted"> · 추천 {recommender.name}</span>}
          </p>
          {book.selection_reason && <p className="whitespace-pre-line">{book.selection_reason}</p>}
          {book.recommend_reason && <p className="whitespace-pre-line text-muted">추천 이유: {book.recommend_reason}</p>}
          <p>
            <span className="text-muted">모임</span> {meeting ? `${meeting.number}회 · ${fmtDate(meeting.date)}${meeting.place ? ` · ${meeting.place}` : ''}` : '아직 모임 기록이 없어요'}
          </p>
          {book.status === 'wishlist' && <p className="text-muted">관심 있는 멤버 {interested}명</p>}
        </Card>
      </Section>

      {book.description && (
        <Section title="책 소개">
          <p className="whitespace-pre-line leading-relaxed text-ink">{book.description}</p>
        </Section>
      )}

      {book.status === 'done' && (
        <Section title="멤버별 별점">
          <Card>
            <BookScoreBars rows={[{ bookId: book.id, title: book.title, avg, scores }]} members={members} linkTitles={false} />
            {missing.length > 0 && (
              <p className="mt-3 text-sm text-muted">
                평점 대기: {missing.map((mid) => memberById.get(mid)?.name).join(', ')}
              </p>
            )}
          </Card>
        </Section>
      )}

      {ratings.some((r) => r.one_liner) && (
        <Section title="한 줄 평">
          <ul className="space-y-2">
            {ratings
              .filter((r) => r.one_liner)
              .map((r) => {
                const m = memberById.get(r.member_id);
                return (
                  <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                    <p>“{r.one_liner}”</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                      {m && <Avatar id={m.id} name={m.name} color={m.color} />}
                      {m?.name} · ★ {fmtScore(Number(r.score))}
                    </p>
                  </li>
                );
              })}
          </ul>
        </Section>
      )}

      {ratings.some((r) => r.quote) && (
        <Section title="인상 깊은 문장">
          <ul className="space-y-3">
            {ratings
              .filter((r) => r.quote)
              .map((r) => (
                <li key={r.id}>
                  <blockquote className="border-l-4 border-accent pl-4 font-serif leading-relaxed">{r.quote}</blockquote>
                  <p className="mt-1 pl-5 text-sm text-muted">— {memberById.get(r.member_id)?.name}</p>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {meeting?.questions && (
        <Section title="발제 질문">
          <Card className="whitespace-pre-line leading-relaxed">{meeting.questions}</Card>
        </Section>
      )}
    </article>
  );
}
