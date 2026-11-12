import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar } from '@/components/avatar';
import { Cover } from '@/components/cover';
import { Card } from '@me/ui/section';
import { getCurrentMember } from '@/lib/auth/member';
import { nextSelector } from '@/lib/stats';
import { getView } from '@/lib/view';
import { toggleInterest } from './actions';

export const metadata: Metadata = { title: '위시리스트 · 독서 모임' };

export default async function WishlistPage() {
  const me = await getCurrentMember(); // 게스트(읽기 전용)는 null: 추천·관심 버튼을 숨긴다
  const { data, s, memberById } = await getView();
  const selector = nextSelector(s.members, s.books, s.meetings);

  const cards = data.books
    .filter((b) => b.status === 'wishlist')
    .map((b) => {
      const who = data.interests.filter((i) => i.book_id === b.id).map((i) => memberById.get(i.member_id)).filter((m): m is NonNullable<typeof m> => !!m);
      return { b, who, mineOn: !!me && who.some((m) => m.id === me.id) };
    })
    .sort((a, b) => b.who.length - a.who.length || a.b.title.localeCompare(b.b.title));

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">위시리스트</h1>

      <Card className="space-y-3">
        <p className="text-sm text-muted">다음 선정자</p>
        <p className="flex items-center gap-2 font-serif text-lg font-bold">
          {selector ? (
            <>
              <Avatar name={selector.name} color={memberById.get(selector.id)?.color ?? '#888'} />
              {selector.name}
            </>
          ) : (
            '아직 정해지지 않았어요'
          )}
        </p>
        {me && (
          <Link href="/wishlist/new" className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-ink">
            책 추천하기
          </Link>
        )}
      </Card>

      {cards.length === 0 ? (
        <Card className="text-center text-muted">아직 추천된 책이 없어요. 첫 책을 추천해 보세요.</Card>
      ) : (
        <ul className="space-y-3">
          {cards.map(({ b, who, mineOn }) => (
            <li key={b.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
              <Link href={`/books/${b.id}`} className="w-20 shrink-0">
                <Cover title={b.title} authors={b.authors} genre={b.genre} coverPath={b.cover_path} />
              </Link>
              <div className="min-w-0 flex-1 space-y-1">
                <Link href={`/books/${b.id}`} className="block font-serif text-base font-bold leading-snug">
                  {b.title}
                </Link>
                <p className="text-xs text-muted">{b.authors.join(', ')}</p>
                <p className="text-sm text-muted">추천 {b.recommended_by ? memberById.get(b.recommended_by)?.name : '미지정'}</p>
                {b.recommend_reason && <p className="line-clamp-3 text-sm">{b.recommend_reason}</p>}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-sm text-muted">관심 {who.length}명</p>
                  {me && (
                  <form action={toggleInterest}>
                    <input type="hidden" name="bookId" value={b.id} />
                    <button type="submit" aria-pressed={mineOn} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${mineOn ? 'border-accent bg-accent text-accent-ink' : 'border-line'}`}>
                      {mineOn ? '✓ 나도 읽고 싶어요' : '나도 읽고 싶어요'}
                    </button>
                  </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
