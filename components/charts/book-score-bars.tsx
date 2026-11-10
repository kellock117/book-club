'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fmtScore } from '@/lib/format';
import { Insufficient } from '../section';

export type BookBars = {
  bookId: string;
  title: string;
  avg: number | null;
  scores: { memberId: string; name: string; color: string; score: number | null }[];
};

/** C2: 책별 멤버 별점 묶음 막대 + 평균 표시선. 막대를 누르거나 올리면 정확한 값이 아래에 나온다. 축은 항상 0~5. */
export function BookScoreBars({ rows, members, linkTitles = true }: { rows: BookBars[]; members: { id: string; name: string; color: string }[]; linkTitles?: boolean }) {
  const [readout, setReadout] = useState('막대를 누르면 정확한 값이 보여요');
  if (rows.length === 0) return <Insufficient>아직 평점을 받은 책이 없어요</Insufficient>;
  return (
    <figure>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="범례">
        {members.map((m) => (
          <li key={m.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: m.color }} />
            {m.name}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5 text-muted">
          <span aria-hidden className="h-3.5 w-0.5 bg-ink" />
          평균
        </li>
      </ul>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.bookId}>
            <p className="mb-1 flex items-baseline justify-between gap-2 text-sm font-medium">
              {linkTitles ? (
                <Link href={`/books/${r.bookId}`} className="underline-offset-2 hover:underline">
                  {r.title}
                </Link>
              ) : (
                r.title
              )}
              <span className="shrink-0 text-xs font-normal text-muted tabular-nums">평균 {fmtScore(r.avg)}</span>
            </p>
            <div className="relative space-y-0.5 border-l border-line">
              {r.scores.map((s) => (
                <button
                  key={s.memberId}
                  type="button"
                  onClick={() => setReadout(`${r.title} · ${s.name} · ${s.score === null ? '평점 대기' : `${fmtScore(s.score)}점`}`)}
                  onMouseEnter={() => setReadout(`${r.title} · ${s.name} · ${s.score === null ? '평점 대기' : `${fmtScore(s.score)}점`}`)}
                  aria-label={`${s.name} ${s.score === null ? '평점 대기' : `${fmtScore(s.score)}점`}`}
                  className="flex h-6 w-full items-center"
                >
                  {s.score === null ? (
                    <span className="text-[11px] text-muted">&nbsp;대기</span>
                  ) : (
                    <span className="h-3 rounded-r-[4px]" style={{ width: `${(s.score / 5) * 100}%`, backgroundColor: s.color }} />
                  )}
                </button>
              ))}
              {r.avg !== null && <span aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${(r.avg / 5) * 100}%` }} />}
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1 flex justify-between border-t border-line pt-1 text-[11px] text-muted tabular-nums">
        {[0, 1, 2, 3, 4, 5].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-muted">
        {readout}
      </p>
    </figure>
  );
}
