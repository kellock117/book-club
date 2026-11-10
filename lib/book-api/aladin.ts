import type { BookCandidate } from './types';

const BASE = 'https://www.aladin.co.kr/ttb/api';

// 알라딘 JSON 응답의 한 항목. 필드명은 안내 문서 기준이며 실제 응답으로 확인해야 한다(확인 전).
type AladinItem = {
  title?: string;
  author?: string;
  publisher?: string;
  pubDate?: string;
  isbn13?: string;
  cover?: string;
  categoryName?: string;
  description?: string;
  subInfo?: { itemPage?: number | string };
  bookinfo?: { itemPage?: number | string }; // 구형 문서의 위치. 둘 다 받는다
};

/** "제목 - 부제" → "제목" */
export function stripSubtitle(title: string): string {
  const i = title.indexOf(' - ');
  return (i > 0 ? title.slice(0, i) : title).trim();
}

/** "다자이 오사무 (지은이), 김춘미 (옮긴이)" → 저자/역자 분리. 역할 표기가 없으면 저자로 본다. */
export function parseAuthors(raw: string | undefined): { authors: string[]; translators: string[] } {
  const authors: string[] = [];
  const translators: string[] = [];
  for (const part of (raw ?? '').split(',')) {
    const m = part.trim().match(/^(.*?)\s*(?:\(([^)]*)\))?$/);
    const name = m?.[1]?.trim();
    if (!name) continue;
    const role = m?.[2] ?? '';
    if (role.includes('옮긴이')) translators.push(name);
    else if (role === '' || role.includes('지은이')) authors.push(name);
    // 그림·엮은이 등은 쓰지 않는다
  }
  return { authors, translators };
}

function toPages(v: number | string | undefined): number | null {
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

export function parseAladinItem(item: AladinItem): BookCandidate {
  const { authors, translators } = parseAuthors(item.author);
  const isbn = item.isbn13?.trim();
  return {
    isbn13: isbn && /^\d{13}$/.test(isbn) ? isbn : null,
    title: stripSubtitle(item.title ?? ''),
    authors,
    translators,
    publisher: item.publisher?.trim() || null,
    publishedDate: item.pubDate && /^\d{4}-\d{2}-\d{2}$/.test(item.pubDate) ? item.pubDate : null,
    coverUrl: item.cover?.trim() || null,
    categoryName: item.categoryName?.trim() || null,
    description: item.description?.trim() || null,
    pages: toPages(item.subInfo?.itemPage ?? item.bookinfo?.itemPage),
    source: 'aladin',
  };
}

/** output=js 응답은 끝에 ';'가 붙을 수 있다. */
function parseJsonLoose(text: string): { item?: AladinItem[]; errorMessage?: string } {
  return JSON.parse(text.trim().replace(/;$/, ''));
}

async function call(endpoint: string, params: Record<string, string>): Promise<AladinItem[]> {
  const url = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('output', 'js');
  url.searchParams.set('Version', '20131101');
  const res = await fetch(url, { next: { revalidate: 86400 } } as RequestInit);
  if (!res.ok) throw new Error(`Aladin ${endpoint} HTTP ${res.status}`);
  const body = parseJsonLoose(await res.text());
  if (body.errorMessage) throw new Error(`Aladin ${endpoint}: ${body.errorMessage}`);
  return body.item ?? [];
}

export async function searchAladin(ttbKey: string, query: string): Promise<BookCandidate[]> {
  const items = await call('ItemSearch.aspx', {
    ttbkey: ttbKey,
    Query: query,
    QueryType: 'Keyword',
    SearchTarget: 'Book',
    Cover: 'Big',
    MaxResults: '10',
    start: '1',
  });
  return items.map(parseAladinItem);
}

export async function lookupAladin(ttbKey: string, isbn13: string): Promise<BookCandidate | null> {
  const items = await call('ItemLookUp.aspx', {
    ttbkey: ttbKey,
    ItemIdType: 'ISBN13',
    ItemId: isbn13,
    Cover: 'Big',
  });
  return items[0] ? parseAladinItem(items[0]) : null;
}
