'use client';

import { useEffect, useRef, useState } from 'react';
import { GENRES } from '@/lib/validation/admin';

/** /api/books/search가 돌려주는 후보 (lib/book-api/types.ts의 BookCandidate와 같은 모양) */
export type Candidate = {
  isbn13: string | null;
  title: string;
  authors: string[];
  translators: string[];
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  description: string | null;
  pages: number | null;
  source: 'aladin' | 'kakao';
};

type Picked = { candidate: Candidate | null }; // null = 직접 입력

const input = 'min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base';

function Err({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null;
  return (
    <p role="alert" className="mt-2 text-sm font-medium text-danger">
      {msgs[0]}
    </p>
  );
}

/**
 * 책 검색 → 고르기 → 정보 확인(수정 가능). 서버 액션에 보낼 입력 칸을 모두 이 안에 그린다.
 * 검색에 없는 책은 "직접 입력"으로 제목·저자만 넣을 수 있다.
 */
const EMPTY: Record<string, never> = {};

export function BookFields({ errors = EMPTY, values: serverValues = EMPTY }: { errors?: Record<string, string[]>; values?: Record<string, string> }) {
  // 오류로 돌아왔을 때(values가 있을 때)는 이미 고른 상태로 연다
  const [picked, setPickedRaw] = useState<Picked | null>(serverValues.title !== undefined ? { candidate: null } : null);
  // 서버가 돌려준 입력값은 처음 고른 책에만 쓴다. 다시 고르면 새 후보의 값을 쓴다.
  const [useServerValues, setUseServerValues] = useState(true);
  useEffect(() => setUseServerValues(true), [serverValues]);
  const values: Record<string, string> = useServerValues ? serverValues : EMPTY;
  const setPicked = (next: Picked | null) => {
    setUseServerValues(false);
    setPickedRaw(next);
  };
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  // 300ms 디바운스 후 검색. 오래된 응답은 버린다.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setSearchError(null);
      return;
    }
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
        const body = (await res.json()) as { books?: Candidate[]; error?: string };
        if (mine !== seq.current) return;
        if (!res.ok) {
          setSearchError(body.error ?? '검색에 실패했어요');
          setResults(null);
        } else {
          setSearchError(null);
          setResults(body.books ?? []);
        }
      } catch {
        if (mine === seq.current) setSearchError('검색에 실패했어요. 직접 입력해 주세요.');
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!picked) {
    return (
      <div className="space-y-3">
        <div>
          <label htmlFor="book-search" className="mb-2 block text-sm font-medium">
            책 검색
          </label>
          <input
            id="book-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목이나 저자를 입력하세요"
            autoComplete="off"
            className={input}
          />
        </div>
        <div aria-live="polite" className="space-y-2">
          {loading && <p className="text-sm text-muted">검색 중…</p>}
          {searchError && (
            <p role="alert" className="text-sm font-medium text-danger">
              {searchError}
            </p>
          )}
          {!loading && !searchError && results && results.length === 0 && <p className="text-sm text-muted">검색 결과가 없어요. 직접 입력해 보세요.</p>}
          {results && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((c, i) => (
                <li key={`${c.isbn13 ?? c.title}-${i}`}>
                  <button type="button" onClick={() => setPicked({ candidate: c })} className="flex min-h-16 w-full gap-3 rounded-xl border border-line bg-surface p-2 text-left">
                    {c.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.coverUrl} alt="" className="h-20 w-14 shrink-0 rounded object-cover" />
                    ) : (
                      <span aria-hidden className="h-20 w-14 shrink-0 rounded bg-line" />
                    )}
                    <span className="min-w-0 space-y-0.5">
                      <span className="line-clamp-2 block font-serif font-bold leading-snug">{c.title}</span>
                      <span className="block text-sm text-muted">{c.authors.join(', ') || '저자 미상'}</span>
                      <span className="block text-xs text-muted">
                        {[c.publisher, c.publishedDate?.slice(0, 4)].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => setPicked({ candidate: null })} className="min-h-11 text-sm font-medium text-muted underline underline-offset-2">
          찾는 책이 없어요 · 직접 입력
        </button>
        <Err msgs={errors.title} />
      </div>
    );
  }

  const c = picked.candidate;
  const v = (name: string, fallback: string) => values[name] ?? fallback;
  const hidden = (name: string, fallback: string) => <input type="hidden" name={name} value={v(name, fallback)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{c ? '고른 책' : '직접 입력'}</p>
        <button type="button" onClick={() => setPicked(null)} className="min-h-11 text-sm text-muted underline underline-offset-2">
          다시 고르기
        </button>
      </div>

      {hidden('translators', c?.translators.join(', ') ?? '')}
      {hidden('publisher', c?.publisher ?? '')}
      {hidden('publishedDate', c?.publishedDate ?? '')}
      {hidden('isbn13', c?.isbn13 ?? '')}
      {hidden('description', c?.description ?? '')}
      {hidden('coverUrl', c?.coverUrl ?? '')}
      {hidden('infoSource', c ? c.source : 'manual')}

      <div className="flex gap-3">
        {c?.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverUrl} alt="" className="h-28 w-20 shrink-0 rounded object-cover" />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              제목 <span className="text-danger">*</span>
            </label>
            <input id="title" name="title" defaultValue={v('title', c?.title ?? '')} autoComplete="off" className={input} aria-invalid={errors.title ? true : undefined} />
            <Err msgs={errors.title} />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="authors" className="mb-1 block text-sm font-medium">
          저자 <span className="font-normal text-muted">(쉼표로 구분)</span>
        </label>
        <input id="authors" name="authors" defaultValue={v('authors', c?.authors.join(', ') ?? '')} autoComplete="off" className={input} />
        <Err msgs={errors.authors} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pages" className="mb-1 block text-sm font-medium">
            쪽수
          </label>
          <input id="pages" name="pages" type="number" inputMode="numeric" min={1} max={10000} defaultValue={v('pages', c?.pages ? String(c.pages) : '')} placeholder="모르면 비워 두기" className={input} />
          <Err msgs={errors.pages} />
        </div>
        <div>
          <label htmlFor="genre" className="mb-1 block text-sm font-medium">
            장르
          </label>
          <select id="genre" name="genre" defaultValue={v('genre', '')} className={input}>
            <option value="">선택 안 함</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <Err msgs={errors.genre} />
        </div>
      </div>
      <Err msgs={errors.isbn13} />
      <Err msgs={errors.coverUrl} />
    </div>
  );
}
