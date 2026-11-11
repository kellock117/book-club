'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { BookFields } from '@/components/book-fields';
import type { BookFormState } from '@/lib/books/form-state';
import { selectBook } from './actions';

type Props = {
  members: { id: string; name: string }[];
  defaultSelectedBy: string;
  wishlist: { id: string; title: string; authors: string; interest: number }[];
};

const input = 'min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base';
const Err = ({ msgs }: { msgs?: string[] }) =>
  msgs?.length ? (
    <p role="alert" className="mt-2 text-sm font-medium text-danger">
      {msgs[0]}
    </p>
  ) : null;

export function SelectForm({ members, defaultSelectedBy, wishlist }: Props) {
  const [state, action, pending] = useActionState<BookFormState, FormData>(selectBook, {});
  const e = state.errors ?? {};
  const [mode, setMode] = useState<'wishlist' | 'new'>(wishlist.length > 0 ? 'wishlist' : 'new');
  const v = state.values ?? {};
  const d = state.duplicate;

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="mode" value={mode} />

      <div role="tablist" aria-label="책 고르는 방법" className="grid grid-cols-2 gap-2">
        {(
          [
            ['wishlist', `위시리스트에서 (${wishlist.length})`],
            ['new', '새로 검색'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`min-h-12 rounded-xl border text-sm font-semibold ${mode === key ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'wishlist' ? (
        <div>
          <label htmlFor="bookId" className="mb-2 block text-sm font-medium">
            책
          </label>
          {wishlist.length === 0 ? (
            <p className="text-sm text-muted">위시리스트가 비어 있어요. 새로 검색해 보세요.</p>
          ) : (
            <select id="bookId" name="bookId" defaultValue={v.bookId ?? ''} className={input} aria-invalid={e.bookId ? true : undefined}>
              <option value="">책을 골라 주세요</option>
              {wishlist.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                  {b.authors ? ` · ${b.authors}` : ''} (관심 {b.interest})
                </option>
              ))}
            </select>
          )}
          <Err msgs={e.bookId} />
        </div>
      ) : (
        <BookFields errors={e} values={v.mode === 'new' ? state.values : undefined} />
      )}

      {d && (
        <div role="alert" className="space-y-2 rounded-2xl border border-accent bg-surface p-4">
          <p className="font-semibold">{d.status === 'wishlist' ? '이미 위시리스트에 있는 책이에요. "위시리스트에서"에서 골라 주세요.' : '이미 등록된 책이에요'}</p>
          <Link href={`/books/${d.id}`} className="block font-serif font-bold underline underline-offset-2">
            {d.title}
          </Link>
        </div>
      )}

      <div>
        <label htmlFor="selectedBy" className="mb-2 block text-sm font-medium">
          선정자
        </label>
        <select id="selectedBy" name="selectedBy" defaultValue={v.selectedBy ?? defaultSelectedBy} className={input}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <Err msgs={e.selectedBy} />
      </div>

      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium">
          선정 이유 <span className="text-danger">*</span>
        </label>
        <textarea id="reason" name="reason" rows={3} maxLength={500} defaultValue={v.reason ?? ''} className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base" aria-invalid={e.reason ? true : undefined} />
        <Err msgs={e.reason} />
      </div>

      <div>
        <label htmlFor="date" className="mb-2 block text-sm font-medium">
          모임 날짜 <span className="text-danger">*</span>
        </label>
        <input id="date" name="date" type="date" defaultValue={v.date ?? ''} className={input} aria-invalid={e.date ? true : undefined} />
        <Err msgs={e.date} />
      </div>

      {e.form && (
        <p role="alert" className="text-sm font-medium text-danger">
          {e.form[0]}
        </p>
      )}

      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-60">
        {pending ? '저장 중…' : '이번 달 책으로 정하기'}
      </button>
    </form>
  );
}
