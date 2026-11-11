'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 잠깐 떴다 사라지는 알림.
 *
 * 서버 액션이 `redirect('/?toast=코드')`로 보내면, 이 컴포넌트가 코드에 맞는 문구를 3초 동안 보여 주고
 * 주소에서 `toast` 값을 지운다(새로고침해도 다시 뜨지 않게).
 * 코드와 문구의 표는 앱마다 다르므로 `messages`로 받는다. useSearchParams를 쓰므로 <Suspense>로 감싸서 쓴다.
 *
 * @param messages 예: { saved: '저장했어요' }
 */
export function Toast({ messages }: { messages: Record<string, string> }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const code = params.get('toast');

  useEffect(() => {
    if (!code) return;
    const text = messages[code];
    if (text) setMessage(text);
    const next = new URLSearchParams(params.toString());
    next.delete('toast');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      {message && <div className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-lg">{message}</div>}
    </div>
  );
}
