import type { Metadata } from 'next';
import { Card, Section } from '@/components/section';
import { isAdmin } from '@/lib/auth/admin';
import { getClubData } from '@/lib/data';
import { GENRES } from '@/lib/validation/admin';
import { deleteBook, deleteMeeting, deleteRating } from './actions';
import { AdminLoginForm, BookForm, DeleteButton, LogoutButton, MemberForm } from './forms';

export const metadata: Metadata = { title: '관리 · 독서 모임', robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdmin())) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold">관리</h1>
        <p className="text-sm text-muted">관리자 비밀번호를 한 번 더 입력해야 열려요.</p>
        <AdminLoginForm />
      </div>
    );
  }

  const { error } = await searchParams;
  const { members, books, meetings, ratings } = await getClubData();
  const bookTitle = new Map(books.map((b) => [b.id, b.title]));
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const sortedMeetings = [...meetings].sort((a, b) => b.number - a.number);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">관리</h1>
        <LogoutButton />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Section title="백업">
        <Card className="space-y-2 text-sm">
          <p className="text-muted">매주 월요일에 자동으로 저장되고 12주 동안 보관돼요.</p>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/backup" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-semibold text-accent-ink">
              최신 백업 내려받기
            </a>
            <a href="/admin/backup?fresh=1" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 font-medium">
              지금 상태 내려받기
            </a>
          </div>
        </Card>
      </Section>

      <Section title="멤버">
        <div className="space-y-3">
          {members.map((m) => (
            <Card key={m.id}>
              <p className="mb-3 flex items-center gap-2 font-semibold">
                <span className="size-4 rounded-full" style={{ backgroundColor: m.color }} aria-hidden />
                {m.name}
              </p>
              <MemberForm member={m} />
            </Card>
          ))}
          <Card>
            <p className="mb-3 font-semibold">멤버 추가</p>
            <MemberForm />
          </Card>
        </div>
      </Section>

      <Section title={`책 (${books.length})`}>
        <div className="space-y-3">
          {books.map((b) => (
            <Card key={b.id}>
              <details>
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 font-medium">
                  <span>{b.title}</span>
                  <span className="text-xs text-muted">{b.status}</span>
                </summary>
                <div className="mt-3 space-y-4">
                  <BookForm book={b} genres={GENRES} />
                  <DeleteButton action={deleteBook} id={b.id} what={`책 「${b.title}」을(를) 삭제합니다. 이 책의 평점과 관심 표시도 함께 지워져요.`} />
                </div>
              </details>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={`모임 (${meetings.length})`}>
        <div className="space-y-2">
          {sortedMeetings.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">
                제{m.number}회 · {m.date} · {m.book_id ? (bookTitle.get(m.book_id) ?? '?') : '책 없음'}
              </span>
              <DeleteButton action={deleteMeeting} id={m.id} what={`제${m.number}회 모임 기록을 삭제합니다.`} />
            </Card>
          ))}
        </div>
      </Section>

      <Section title={`평점 (${ratings.length})`}>
        <div className="space-y-2">
          {ratings.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">
                {bookTitle.get(r.book_id) ?? '?'} · {memberName.get(r.member_id) ?? '?'} · {r.score}점
              </span>
              <DeleteButton
                action={deleteRating}
                id={r.id}
                what={`${memberName.get(r.member_id) ?? '?'}님이 「${bookTitle.get(r.book_id) ?? '?'}」에 준 ${r.score}점 평점을 삭제합니다.`}
              />
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
