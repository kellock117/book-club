'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 서버 액션이 redirect('/?toast=코드')로 보내면 여기서 메시지를 한 번 보여 주고 주소에서 지운다.
const MESSAGES: Record<string, string> = {
  rated: '평점을 남겼어요',
  deleted: '삭제했어요',
};

export function Toast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const code = params.get('toast');

  useEffect(() => {
    if (!code) return;
    const text = MESSAGES[code];
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
