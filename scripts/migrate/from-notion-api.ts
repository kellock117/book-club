import notionSdk from '@notionhq/client';
import { notionId, type Snapshot } from './snapshot';

// @notionhq/client는 CJS라 Node ESM에서 named import가 안 된다. default에서 꺼낸다.
const { Client } = notionSdk;
type Client = InstanceType<typeof Client>;

export const DATA_SOURCE_IDS = {
  books: '3a4e9e74-7feb-80e2-9d44-000bfca18c3e',
  members: '3068b073-5fb8-4ff7-bea5-02935f84c965',
  meetings: '2d95ed80-72ea-406d-9189-f4074c06f8d9',
  ratings: '860bfb05-861b-4edd-a88b-2fcfa7d4d1ee',
} as const;

// 노션 API의 페이지 properties는 구조가 깊어서 필요한 모양만 느슨하게 받는다.
type Prop = Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
export type ApiPage = { id: string; properties: Record<string, Prop> };

const plain = (arr: Array<{ plain_text: string }> | undefined) => (arr ?? []).map((t) => t.plain_text).join('');
const title = (p: Prop) => plain(p?.title);
const text = (p: Prop) => plain(p?.rich_text);
const num = (p: Prop): number | null => (typeof p?.number === 'number' ? p.number : null);
const sel = (p: Prop): string | null => p?.select?.name ?? p?.status?.name ?? null;
const date = (p: Prop): string | null => p?.date?.start ?? null;
const rel = (p: Prop): string[] => (p?.relation ?? []).map((r: { id: string }) => notionId(r.id));

/** API 페이지 → 스냅샷. 순수 함수라 테스트할 수 있다. */
export function normalizeApiPages(raw: {
  members: ApiPage[];
  books: ApiPage[];
  meetings: ApiPage[];
  ratings: ApiPage[];
}): Snapshot {
  return {
    members: raw.members.map((p) => ({
      id: notionId(p.id),
      name: title(p.properties['이름']),
      rotationOrder: num(p.properties['선정 순서']),
      status: sel(p.properties['상태']),
    })),
    books: raw.books.map((p) => ({
      id: notionId(p.id),
      title: title(p.properties['제목']),
      authors: text(p.properties['저자']),
      genre: sel(p.properties['장르']),
      status: sel(p.properties['상태']) ?? '위시리스트',
      pages: num(p.properties['쪽수']),
      selectionReason: text(p.properties['선정 이유']),
      recommendReason: text(p.properties['추천 이유']),
      selectedBy: rel(p.properties['선정자']),
      recommendedBy: rel(p.properties['추천자']),
      interestedMemberIds: rel(p.properties['나도 읽고 싶어요']),
    })),
    meetings: raw.meetings.map((p) => ({
      id: notionId(p.id),
      title: title(p.properties['회차']),
      date: date(p.properties['날짜']),
      place: text(p.properties['장소']),
      questions: text(p.properties['발제 질문']),
      bookIds: rel(p.properties['책']),
      attendeeIds: rel(p.properties['참석자']),
    })),
    ratings: raw.ratings.map((p) => ({
      id: notionId(p.id),
      bookId: rel(p.properties['책'])[0] ?? null,
      memberId: rel(p.properties['멤버'])[0] ?? null,
      score: num(p.properties['별점']),
      oneLiner: title(p.properties['한 줄 평']),
      quote: text(p.properties['인상 깊은 문장']),
    })),
  };
}

async function queryAll(notion: Client, dataSourceId: string): Promise<ApiPage[]> {
  const pages: ApiPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
    for (const r of res.results) if ('properties' in r) pages.push(r as unknown as ApiPage);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}

export async function loadFromNotionApi(token: string): Promise<Snapshot> {
  const notion = new Client({ auth: token });
  const [members, books, meetings, ratings] = await Promise.all([
    queryAll(notion, DATA_SOURCE_IDS.members),
    queryAll(notion, DATA_SOURCE_IDS.books),
    queryAll(notion, DATA_SOURCE_IDS.meetings),
    queryAll(notion, DATA_SOURCE_IDS.ratings),
  ]);
  return normalizeApiPages({ members, books, meetings, ratings });
}
