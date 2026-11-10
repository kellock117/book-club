import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TabBar } from '@/components/tab-bar';
import { getCurrentMember } from '@/lib/auth/member';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect('/who'); // 쿠키의 멤버가 없어졌거나 활동 중이 아닐 때

  return (
    <>
      <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-4">
        <Link href="/" className="font-serif text-xl font-bold">
          독서 모임
        </Link>
        <Link
          href="/who"
          aria-label={`${me.name}님으로 보는 중. 누르면 이름을 바꿀 수 있어요`}
          className="flex size-11 items-center justify-center rounded-full text-base font-bold text-white"
          style={{ backgroundColor: me.color }}
        >
          {me.name.slice(0, 1)}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">{children}</main>
      <TabBar />
    </>
  );
}
