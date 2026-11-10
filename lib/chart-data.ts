import {
  disagreementByBook,
  generosityIndex,
  tasteDistance,
  bookAverage,
  type StatsBook,
  type StatsMeeting,
  type StatsMember,
  type StatsRating,
  type TasteDistance,
} from './stats';

/** 차트용 데이터 가공 (스펙 8장). 계산은 lib/stats.ts의 함수를 그대로 쓴다. */

export type HeatmapRow = { bookId: string; title: string; cells: { memberId: string; score: number | null }[] };

/** C1: 행 = 완료 책, 열 = 활동 멤버. 평점이 없는 칸은 score null("대기"). */
export function heatmapRows(books: StatsBook[], members: StatsMember[], ratings: StatsRating[], order: (b: StatsBook) => string = () => ''): HeatmapRow[] {
  const active = members.filter((m) => m.status === 'active').sort((a, b) => a.rotationOrder - b.rotationOrder);
  return books
    .filter((b) => b.status === 'done')
    .sort((a, b) => order(b).localeCompare(order(a)))
    .map((b) => ({
      bookId: b.id,
      title: b.title,
      cells: active.map((m) => ({ memberId: m.id, score: ratings.find((r) => r.bookId === b.id && r.memberId === m.id)?.score ?? null })),
    }));
}

/** 한 책에 대해 멤버별 별점 (C2, 책 상세). 평점 없는 멤버는 null. */
export function bookMemberScores(bookId: string, members: StatsMember[], ratings: StatsRating[]) {
  return members
    .filter((m) => m.status === 'active' || ratings.some((r) => r.bookId === bookId && r.memberId === m.id))
    .sort((a, b) => a.rotationOrder - b.rotationOrder)
    .map((m) => ({ memberId: m.id, name: m.name, score: ratings.find((r) => r.bookId === bookId && r.memberId === m.id)?.score ?? null }));
}

export type TrendPoint = { number: number; avg: number; n: number; title: string };

/** C3: 모임 회차별 평균 별점. 책이 없거나 평점이 하나도 없는 회차는 점을 찍지 않고 skipped에 넣는다. */
export function meetingTrend(meetings: StatsMeeting[], books: StatsBook[], ratings: StatsRating[]): { points: TrendPoint[]; skipped: number[] } {
  const points: TrendPoint[] = [];
  const skipped: number[] = [];
  for (const m of [...meetings].sort((a, b) => a.number - b.number)) {
    const book = m.bookId ? books.find((b) => b.id === m.bookId) : undefined;
    const { avg, n } = m.bookId ? bookAverage(ratings, m.bookId) : { avg: null, n: 0 };
    if (!book || avg === null) skipped.push(m.number);
    else points.push({ number: m.number, avg, n, title: book.title });
  }
  return { points, skipped };
}

/** C4: 멤버별 후함 지수. 계산할 책이 없으면 value null. 큰 값이 위로 오도록 정렬. */
export function generosityRows(members: StatsMember[], ratings: StatsRating[]) {
  return members
    .filter((m) => m.status === 'active')
    .map((m) => ({ memberId: m.id, name: m.name, value: generosityIndex(ratings, m.id) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
}

/** C5: 의견 차이 순위(표준편차 큰 순). */
export function disagreementRows(books: StatsBook[], ratings: StatsRating[]) {
  return disagreementByBook(ratings)
    .map((d) => ({ ...d, title: books.find((b) => b.id === d.bookId)?.title ?? '' }))
    .filter((d) => d.title !== '');
}

export const NO_GENRE = '미분류';

/** C6: 읽은(완료) 책의 장르 분포. 많은 순, 같으면 이름순. */
export function genreShare(books: { status: string; genre: string | null }[]) {
  const counts = new Map<string, number>();
  const done = books.filter((b) => b.status === 'done');
  for (const b of done) {
    const g = b.genre?.trim() || NO_GENRE;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count, share: count / done.length }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
}

export type TasteCell = { rowId: string; colId: string; result: TasteDistance | 'self' };

/** C7: 멤버 × 멤버 취향 거리 격자. 자기 자신은 'self'. */
export function tasteMatrix(members: StatsMember[], ratings: StatsRating[]): { members: StatsMember[]; cells: TasteCell[] } {
  const active = members.filter((m) => m.status === 'active').sort((a, b) => a.rotationOrder - b.rotationOrder);
  const cells: TasteCell[] = [];
  for (const a of active) for (const b of active) cells.push({ rowId: a.id, colId: b.id, result: a.id === b.id ? 'self' : tasteDistance(ratings, a.id, b.id) });
  return { members: active, cells };
}
