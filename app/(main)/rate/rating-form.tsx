'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { StarPicker } from '@/components/star-picker';
import { ONE_LINER_MAX } from '@/lib/validation/rating';
import { saveRating, type RateState } from './actions';

type BookOption = { id: string; title: string; rated: boolean };
type Existing = { score: number; oneLiner: string; quote: string };

export function RatingForm({ bookId, books, existing }: { bookId: string; books: BookOption[]; existing: Existing | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<RateState, FormData>(saveRating, {});
  const initialScore = state.values?.score ? Number(state.values.score) : (existing?.score ?? 0);
  const [score, setScore] = useState(initialScore);
  const [oneLiner, setOneLiner] = useState(state.values?.oneLiner ?? existing?.oneLiner ?? '');
  // 서버가 돌려준 오류는, 그 칸을 다시 고치면 지운다. 새 응답이 오면 다시 보여 준다.
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => setEdited(new Set()), [state]);
  const touch = (field: string) => setEdited((prev) => new Set(prev).add(field));
  const e = Object.fromEntries(Object.entries(state.errors ?? {}).filter(([field]) => !edited.has(field))) as NonNullable<RateState['errors']>;

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="score" value={score || ''} />

      <div>
        <label htmlFor="book" className="mb-2 block text-sm font-medium">
          책
        </label>
        <select
          id="book"
          // 제어 컴포넌트로 두면 React 19가 액션 뒤에 폼을 초기화할 때 첫 항목으로 돌아간다. 책이 바뀌면 폼 전체가 key로 새로 만들어진다.
          defaultValue={bookId}
          onChange={(ev) => router.replace(`/rate?book=${ev.target.value}`)}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-base"
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.rated ? '✓ ' : ''}
              {b.title}
            </option>
          ))}
        </select>
        {e.bookId && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.bookId[0]}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">별점</p>
        <StarPicker
          value={score}
          onChange={(v) => {
            setScore(v);
            touch('score');
          }}
describedBy={e.score ? 'score-error' : undefined} invalid={!!e.score} />
        {e.score && (
          <p id="score-error" role="alert" className="mt-2 text-center text-sm font-medium text-danger">
            {e.score[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="oneLiner" className="mb-2 flex items-baseline justify-between text-sm font-medium">
          <span>
            한 줄 평 <span className="text-danger">*</span>
          </span>
          <span className="font-normal text-muted">
            {oneLiner.length}/{ONE_LINER_MAX}
          </span>
        </label>
        <input
          id="oneLiner"
          name="oneLiner"
          value={oneLiner}
          onChange={(ev) => {
            setOneLiner(ev.target.value);
            touch('oneLiner');
          }}
          maxLength={ONE_LINER_MAX}
          autoComplete="off"
          aria-invalid={e.oneLiner ? true : undefined}
          aria-describedby={e.oneLiner ? 'oneLiner-error' : undefined}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base"
          placeholder="이 책을 한 줄로 말하면?"
        />
        {e.oneLiner && (
          <p id="oneLiner-error" role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.oneLiner[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="quote" className="mb-2 block text-sm font-medium">
          인상 깊은 문장 <span className="font-normal text-muted">(선택)</span>
        </label>
        <textarea
          id="quote"
          name="quote"
          rows={3}
          defaultValue={state.values?.quote ?? existing?.quote ?? ''}
          aria-invalid={e.quote ? true : undefined}
          aria-describedby={e.quote ? 'quote-error' : undefined}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base"
        />
        {e.quote && (
          <p id="quote-error" role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.quote[0]}
          </p>
        )}
      </div>

      {e.form && (
        <p role="alert" className="text-sm font-medium text-danger">
          {e.form[0]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? '저장 중…' : existing ? '평점 고치기' : '평점 남기기'}
      </button>
    </form>
  );
}
