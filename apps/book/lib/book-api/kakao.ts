import type { BookCandidate } from './types';

const ENDPOINT = 'https://dapi.kakao.com/v3/search/book';

// 카카오 책 검색 응답의 한 항목(실제 응답으로 확인: fixtures/kakao-search-*.json). 쪽수·카테고리는 오지 않는다.
export type KakaoDocument = {
  title?: string;
  authors?: string[];
  translators?: string[];
  publisher?: string;
  datetime?: string; // 2009-01-20T00:00:00.000+09:00
  isbn?: string; // "8937460440 9788937460449" (10자리 13자리)
  thumbnail?: string;
  contents?: string;
};

/** "데미안(초판본)(1919년 …)" → "데미안". 괄호 부제와 " - 부제"를 뗀다. 다 떼면 비게 되면 원래 제목을 쓴다. */
export function cleanTitle(raw: string): string {
  const base = raw.split(' - ')[0]!.replace(/\s*[(（].*$/, '').trim();
  return base || raw.trim();
}

/** "8937460440 9788937460449" → "9788937460449". 13자리가 없으면 null. */
export function pickIsbn13(raw: string | undefined): string | null {
  return (raw ?? '').split(/\s+/).find((s) => /^\d{13}$/.test(s)) ?? null;
}

/**
 * 카카오 썸네일은 120×174로 줄인 주소다. fname 인자에 원본 주소가 들어 있어 그것을 쓴다.
 * 원본은 http로 오므로 https로 바꾼다.
 */
export function pickCoverUrl(thumbnail: string | undefined): string | null {
  if (!thumbnail) return null;
  try {
    const original = new URL(thumbnail).searchParams.get('fname');
    const url = original ?? thumbnail;
    return url.replace(/^http:\/\//, 'https://');
  } catch {
    return null;
  }
}

export function parseKakaoDocument(doc: KakaoDocument): BookCandidate {
  const date = doc.datetime?.slice(0, 10);
  const description = doc.contents?.trim();
  return {
    isbn13: pickIsbn13(doc.isbn),
    title: cleanTitle(doc.title ?? ''),
    authors: (doc.authors ?? []).map((a) => a.trim()).filter(Boolean),
    translators: (doc.translators ?? []).map((a) => a.trim()).filter(Boolean),
    publisher: doc.publisher?.trim() || null,
    publishedDate: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    coverUrl: pickCoverUrl(doc.thumbnail),
    categoryName: null,
    description: description || null,
    pages: null,
    source: 'kakao',
  };
}

export async function searchKakao(restApiKey: string, query: string): Promise<BookCandidate[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('size', '10');
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${restApiKey}` }, next: { revalidate: 86400 } } as RequestInit);
  if (!res.ok) throw new Error(`카카오 책 검색 HTTP ${res.status}`);
  const body = (await res.json()) as { documents?: KakaoDocument[] };
  return (body.documents ?? []).map(parseKakaoDocument);
}
