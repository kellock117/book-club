import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/section';
import { nextSelector } from '@/lib/stats';
import { getView } from '@/lib/view';
import { SelectForm } from './select-form';

export const metadata: Metadata = { title: '이번 달 책 정하기 · 독서 모임' };

export default async function SelectPage() {
  const { data, s, memberById } = await getView();
  const selector = nextSelector(s.members, s.books, s.meetings);
  const reading = data.books.find((b) => b.status === 'reading');

  if (reading) {
    const meeting = data.meetings.filter((m) => m.book_id === reading.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-bold">이번 달 책 정하기</h1>
        <Card className="space-y-3">
          <p className="font-semibold">이미 이번 달 책이 정해졌어요</p>
          <p className="text-muted">
            지금 읽는 책은 <Link href={`/books/${reading.id}`} className="font-medium text-ink underline underline-offset-2">{reading.title}</Link>이에요. 모임이 끝나면 다음 책을 정할 수 있어요.
          </p>
          {meeting && (
            <Link href={`/meetings/${meeting.id}/edit`} className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-ink">
              모임 기록하기
            </Link>
          )}
        </Card>
      </div>
    );
  }

  const active = data.members.filter((m) => m.status === 'active').sort((a, b) => a.rotation_order - b.rotation_order);
  const wishlist = data.books
    .filter((b) => b.status === 'wishlist')
    .map((b) => ({ id: b.id, title: b.title, authors: b.authors.join(', '), interest: data.interests.filter((i) => i.book_id === b.id).length }))
    .sort((a, b) => b.interest - a.interest || a.title.localeCompare(b.title));

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">이번 달 책 정하기</h1>
      <Card className="space-y-2">
        <p className="text-sm text-muted">이번 선정자</p>
        <p className="flex items-center gap-3 font-serif text-2xl font-bold">
          {selector ? (
            <>
              <Avatar id={selector.id} name={selector.name} color={memberById.get(selector.id)?.color ?? '#888'} size="md" />
              {selector.name}
            </>
          ) : (
            '정해지지 않았어요'
          )}
        </p>
      </Card>
      <SelectForm members={active.map((m) => ({ id: m.id, name: m.name }))} defaultSelectedBy={selector?.id ?? active[0]?.id ?? ''} wishlist={wishlist} />
    </div>
  );
}
