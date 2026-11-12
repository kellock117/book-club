'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/books', label: '책장', icon: '📚' },
  { href: '/rate', label: '평점', icon: '⭐' },
  { href: '/wishlist', label: '위시리스트', icon: '🔖' },
  { href: '/meetings', label: '모임', icon: '📅' },
];

/** guest: 읽기 전용으로 보는 사람에게는 쓰기 화면(평점)으로 가는 탭을 숨긴다. */
export function TabBar({ guest = false }: { guest?: boolean }) {
  const pathname = usePathname();
  const tabs = guest ? TABS.filter((t) => t.href !== '/rate') : TABS;
  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {tabs.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${active ? 'font-bold text-accent' : 'text-muted'}`}
              >
                <span aria-hidden className="text-xl leading-none">
                  {t.icon}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
