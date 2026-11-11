'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { BookFields } from '@/components/book-fields';
import type { BookFormState } from '@/lib/books/form-state';
import { toggleInterest } from '../actions';
import { recommendBook } from './actions';

export function RecommendForm() {
  const [state, action, pending] = useActionState<BookFormState, FormData>(recommendBook, {});
  const e = state.errors ?? {};
  const d = state.duplicate;

  return (
    <form action={action} className="space-y-6" noValidate>
      <BookFields errors={e} values={state.values} />

      {d && (
        <div role="alert" className="space-y-3 rounded-2xl border border-accent bg-surface p-4">
          <p className="font-semibold">
            {d.status === 'wishlist' ? '이미 위시리스트에 있는 책이에요' : d.status === 'reading' ? '지금 읽고 있는 책이에요' : '이미 함께 읽은 책이에요'}
          </p>
          <Link href={`/books/${d.id}`} className="block font-serif text-base font-bold underline underline-offset-2">
            {d.title} 보러 가기
          </Link>
          {d.status === 'wishlist' && !d.interested && (
            <button
              type="submit"
              formAction={async () => {
                const fd = new FormData();
                fd.set('bookId', d.id);
                await toggleInterest(fd);
              }}
              className="min-h-11 rounded-xl border border-accent px-4 text-sm font-semibold">
              나도 읽고 싶어요
            </button>
          )}
          {d.status === 'wishlist' && d.interested && <p className="text-sm text-muted">이미 관심을 표시했어요</p>}
        </div>
      )}

      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium">
          추천 이유 <span className="text-danger">*</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          maxLength={500}
          defaultValue={state.values?.reason ?? ''}
          aria-invalid={e.reason ? true : undefined}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base"
          placeholder="이 책을 왜 같이 읽고 싶은지 적어 주세요"
        />
        {e.reason && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.reason[0]}
          </p>
        )}
      </div>

      {e.form && (
        <p role="alert" className="text-sm font-medium text-danger">
          {e.form[0]}
        </p>
      )}

      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-60">
        {pending ? '저장 중…' : '추천하기'}
      </button>
    </form>
  );
}
