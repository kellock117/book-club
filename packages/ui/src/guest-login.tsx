'use client';

/**
 * 게스트(로그인 안 한 사람)가 보는 화면의 우측 상단 "로그인" 버튼.
 * 따로 있는 로그인 화면(/login)으로 보내고, 로그인하면 지금 보던 화면으로 돌아오도록 ?next= 를 붙인다.
 * 비밀번호를 확인하는 일은 앱의 로그인 서버 액션이 한다(앱마다 비밀번호·쿠키가 다르다).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function GuestLogin() {
  const pathname = usePathname();
  const href = pathname && pathname !== '/' ? `/login?next=${encodeURIComponent(pathname)}` : '/login';
  return (
    <Link href={href} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink">
      로그인
    </Link>
  );
}
