import type { Metadata } from 'next';
import { getClubData } from '@/lib/data';
import { chooseMember } from './actions';

export const metadata: Metadata = { title: '나는 누구 · 독서 모임', robots: { index: false, follow: false } };

export default async function WhoPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { members } = await getClubData();
  const active = members.filter((m) => m.status === 'active');

  return (
    <>
      <h1 className="mb-2 font-serif text-3xl font-bold">나는 누구?</h1>
      <p className="mb-8 text-muted">이름을 한 번 고르면 평점 같은 입력에 이 이름이 기본으로 들어가요. 위쪽 동그라미를 누르면 바꿀 수 있어요.</p>
      <ul className="space-y-3">
        {active.map((m) => (
          <li key={m.id}>
            <form action={chooseMember}>
              <input type="hidden" name="memberId" value={m.id} />
              {next && <input type="hidden" name="next" value={next} />}
              <button
                type="submit"
                className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-line bg-surface px-4 text-left text-lg font-semibold"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name.slice(0, 1)}
                </span>
                {m.name}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
