import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GuestLogin } from '@me/ui/guest-login';
import { TabBar } from '@/components/tab-bar';
import { isLoggedIn } from '@/lib/auth/access';
import { getCurrentMember } from '@/lib/auth/member';
import { initialOf } from '@/lib/guest-mask';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // 로그인 안 한 사람(게스트): proxy.ts가 허용한 읽기 화면만 여기까지 온다. 읽기 전용 화면을 그린다.
  if (!(await isLoggedIn())) {
    return (
      <>
        <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-4">
          <Link href="/" className="font-serif text-xl font-bold">
            독서 모임
          </Link>
          <GuestLogin />
        </header>
        <p className="mx-auto max-w-md px-4 pt-2 text-xs text-muted">읽기 전용으로 보는 중이에요. 멤버 이름은 가려져 있고, 로그인하면 모두 보여요.</p>
        <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">{children}</main>
        <TabBar guest />
      </>
    );
  }

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
          {initialOf(me.name)}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">{children}</main>
      <TabBar />
    </>
  );
}
