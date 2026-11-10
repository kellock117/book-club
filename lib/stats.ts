/**
 * 독서 모임 통계 계산 (스펙 6장). DB·네트워크·현재 시각에 의존하지 않는 순수 함수만 둔다.
 * - 날짜는 'YYYY-MM-DD' 문자열(한국 날짜)로 다룬다. "오늘"은 호출하는 쪽이 todayInSeoul()로 만들어 넘긴다.
 * - 별점 범위·0.5 단위는 DB 제약과 입력 화면이 막으므로 여기서는 믿고 계산한다.
 */

export type StatsMember = {
  id: string;
  name: string;
  rotationOrder: number;
  status: 'active' | 'pending';
};
export type StatsBook = {
  id: string;
  title: string;
  pages: number | null;
  status: 'wishlist' | 'reading' | 'done';
  selectedBy: string | null;
};
export type StatsMeeting = { id: string; number: number; date: string; bookId: string | null };
export type StatsAttendee = { meetingId: string; memberId: string };
export type StatsRating = { bookId: string; memberId: string; score: number };

// ───────────── 날짜 ─────────────

/** 주어진 시각의 한국(Asia/Seoul) 날짜. */
export function todayInSeoul(now: Date): string {
  // en-CA 로케일은 YYYY-MM-DD 형식으로 나온다
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function parseYmd(s: string): { y: number; m: number; d: number } {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`날짜 형식이 YYYY-MM-DD가 아님: ${s}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function dayNumber(s: string): number {
  const { y, m, d } = parseYmd(s);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** to - from 일수 (to가 뒤면 양수). */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

/** from부터 to까지 꽉 찬 개월 수. 일(日)이 모자라면 한 달을 덜 센다. to가 앞이면 0. */
export function fullMonthsBetween(from: string, to: string): number {
  const a = parseYmd(from);
  const b = parseYmd(to);
  const months = (b.y - a.y) * 12 + (b.m - a.m) - (b.d < a.d ? 1 : 0);
  return Math.max(0, months);
}

// ───────────── 평균·분산 ─────────────

const mean = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length;

/** 모집단 표준편차. */
function stddevPop(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

// ───────────── 요약 숫자 ─────────────

/** 읽은 책: 상태 = 완료인 책 수. */
export function readBookCount(books: StatsBook[]): number {
  return books.filter((b) => b.status === 'done').length;
}

/** 모임 횟수: 날짜가 오늘 이전이거나 오늘인 모임 수. */
export function meetingCount(meetings: StatsMeeting[], today: string): number {
  return meetings.filter((m) => m.date <= today).length;
}

/** 함께한 기간(개월): 첫 모임 날짜부터 오늘까지. 모임이 없으면 0. */
export function monthsTogether(meetings: StatsMeeting[], today: string): number {
  if (meetings.length === 0) return 0;
  const first = meetings.map((m) => m.date).reduce((a, b) => (a < b ? a : b));
  return fullMonthsBetween(first, today);
}

/** 총 쪽수: 완료 책 쪽수 합. 쪽수 없는 책은 빼고 개수를 함께 돌려준다. */
export function totalPages(books: StatsBook[]): { pages: number; missingCount: number } {
  let pages = 0;
  let missingCount = 0;
  for (const b of books) {
    if (b.status !== 'done') continue;
    if (b.pages == null) missingCount++;
    else pages += b.pages;
  }
  return { pages, missingCount };
}

/** 다음 모임 D-day: 오늘 이후(오늘 포함) 가장 가까운 모임까지 남은 일수. 없으면 null. */
export function nextMeetingDday(meetings: StatsMeeting[], today: string): number | null {
  const upcoming = meetings.filter((m) => m.date >= today).map((m) => m.date);
  if (upcoming.length === 0) return null;
  const nearest = upcoming.reduce((a, b) => (a < b ? a : b));
  return daysBetween(today, nearest);
}

// ───────────── 별점 ─────────────

/** 책 평균 별점과 평가 수. 평가가 없으면 avg는 null("—"로 표시). */
export function bookAverage(ratings: StatsRating[], bookId: string): { avg: number | null; n: number } {
  const scores = ratings.filter((r) => r.bookId === bookId).map((r) => r.score);
  return { avg: scores.length ? mean(scores) : null, n: scores.length };
}

/** 전체 평균 별점: 모든 평점 행의 평균 (책 평균들의 평균이 아님). */
export function overallAverage(ratings: StatsRating[]): number | null {
  return ratings.length ? mean(ratings.map((r) => r.score)) : null;
}

/** 멤버가 준 별점의 평균. */
export function memberAverage(ratings: StatsRating[], memberId: string): number | null {
  const scores = ratings.filter((r) => r.memberId === memberId).map((r) => r.score);
  return scores.length ? mean(scores) : null;
}

/** 의견 차이: 평가 2개 이상인 책의 별점 표준편차(모집단). 큰 순으로 정렬한다. */
export function disagreementByBook(ratings: StatsRating[]): { bookId: string; stddev: number; n: number }[] {
  const byBook = new Map<string, number[]>();
  for (const r of ratings) byBook.set(r.bookId, [...(byBook.get(r.bookId) ?? []), r.score]);
  return [...byBook.entries()]
    .filter(([, scores]) => scores.length >= 2)
    .map(([bookId, scores]) => ({ bookId, stddev: stddevPop(scores), n: scores.length }))
    .sort((a, b) => b.stddev - a.stddev);
}

/**
 * 후함 지수: 멤버가 준 각 별점에서 같은 책의 다른 멤버 평균을 뺀 값의 평균.
 * 양수면 후하고 음수면 짜다. 비교할 다른 평가가 없는 책은 뺀다. 계산할 책이 하나도 없으면 null.
 */
export function generosityIndex(ratings: StatsRating[], memberId: string): number | null {
  const diffs: number[] = [];
  for (const mine of ratings.filter((r) => r.memberId === memberId)) {
    const others = ratings.filter((r) => r.bookId === mine.bookId && r.memberId !== memberId);
    if (others.length === 0) continue;
    diffs.push(mine.score - mean(others.map((r) => r.score)));
  }
  return diffs.length ? mean(diffs) : null;
}

export const MIN_COMMON_BOOKS = 3;

export type TasteDistance = { status: 'ok'; distance: number; commonCount: number } | { status: 'insufficient'; commonCount: number };

/** 취향 거리: 두 멤버가 둘 다 평가한 책에서 별점 차이 절대값의 평균. 공통 책이 3권 미만이면 데이터 부족. */
export function tasteDistance(ratings: StatsRating[], memberA: string, memberB: string): TasteDistance {
  const scoreOf = (memberId: string) => new Map(ratings.filter((r) => r.memberId === memberId).map((r) => [r.bookId, r.score]));
  const a = scoreOf(memberA);
  const b = scoreOf(memberB);
  const diffs: number[] = [];
  for (const [bookId, sa] of a) {
    const sb = b.get(bookId);
    if (sb !== undefined) diffs.push(Math.abs(sa - sb));
  }
  if (diffs.length < MIN_COMMON_BOOKS) return { status: 'insufficient', commonCount: diffs.length };
  return { status: 'ok', distance: mean(diffs), commonCount: diffs.length };
}

// ───────────── 참석 ─────────────

/**
 * 참석률: 참석한 모임 수 ÷ 그 멤버의 첫 참석 이후 지난 모임 수.
 * "지난 모임"은 날짜가 오늘 이전이거나 오늘인 모임. 한 번도 참석하지 않았으면 rate는 null.
 */
export function attendanceRate(
  memberId: string,
  meetings: StatsMeeting[],
  attendees: StatsAttendee[],
  today: string,
): { attended: number; eligible: number; rate: number | null } {
  const past = meetings.filter((m) => m.date <= today);
  const attendedIds = new Set(attendees.filter((a) => a.memberId === memberId).map((a) => a.meetingId));
  const attendedPast = past.filter((m) => attendedIds.has(m.id));
  if (attendedPast.length === 0) return { attended: 0, eligible: 0, rate: null };
  const firstDate = attendedPast.map((m) => m.date).reduce((a, b) => (a < b ? a : b));
  const eligible = past.filter((m) => m.date >= firstDate).length;
  return { attended: attendedPast.length, eligible, rate: attendedPast.length / eligible };
}

// ───────────── 선정·대기 ─────────────

/**
 * 다음 선정자: 가장 최근 모임의 책(읽는 중 포함)을 고른 멤버의 다음 순번.
 * 활동 중인 멤버만 선정 순서대로 돌고, 마지막 다음에는 처음으로 돌아간다.
 * 선정자가 비어 있는 책(미지정)은 건너뛰고 그 전 모임을 본다. 기준이 될 모임이 없으면 첫 순번.
 * 활동 중인 멤버가 없으면 null.
 */
export function nextSelector(members: StatsMember[], books: StatsBook[], meetings: StatsMeeting[]): StatsMember | null {
  const active = members.filter((m) => m.status === 'active').sort((a, b) => a.rotationOrder - b.rotationOrder);
  if (active.length === 0) return null;

  const bookById = new Map(books.map((b) => [b.id, b]));
  const latestFirst = [...meetings].sort((a, b) => (a.date === b.date ? b.number - a.number : a.date < b.date ? 1 : -1));
  let lastSelectorId: string | null = null;
  for (const m of latestFirst) {
    const selectedBy = m.bookId ? bookById.get(m.bookId)?.selectedBy : null;
    if (selectedBy) {
      lastSelectorId = selectedBy;
      break;
    }
  }
  const last = lastSelectorId ? members.find((m) => m.id === lastSelectorId) : undefined;
  if (!last) return active[0]!;
  // 마지막 선정자가 지금은 활동 중이 아니어도 순서값 기준으로 다음 사람을 찾는다
  return active.find((m) => m.rotationOrder > last.rotationOrder) ?? active[0]!;
}

/** 평점 대기: 완료 책마다 활동 중인 멤버 중 아직 평점이 없는 사람. */
export function pendingRatings(
  books: StatsBook[],
  members: StatsMember[],
  ratings: StatsRating[],
): { bookId: string; missingMemberIds: string[] }[] {
  const active = members.filter((m) => m.status === 'active');
  return books
    .filter((b) => b.status === 'done')
    .map((b) => {
      const rated = new Set(ratings.filter((r) => r.bookId === b.id).map((r) => r.memberId));
      return { bookId: b.id, missingMemberIds: active.filter((m) => !rated.has(m.id)).map((m) => m.id) };
    });
}

/**
 * 평점 화면의 기본 책: 내가 아직 평점을 안 남긴 가장 최근 완료 책.
 * "최근"은 그 책의 모임 날짜가 늦은 순이고, 모임이 없는 책은 맨 뒤로 보낸다. 없으면 null.
 */
export function latestUnratedBook(
  books: StatsBook[],
  meetings: StatsMeeting[],
  ratings: StatsRating[],
  memberId: string,
): string | null {
  const mine = new Set(ratings.filter((r) => r.memberId === memberId).map((r) => r.bookId));
  const dateOf = (bookId: string) => meetings.filter((m) => m.bookId === bookId).map((m) => m.date).reduce<string>((a, b) => (a > b ? a : b), '');
  const candidates = books
    .filter((b) => b.status === 'done' && !mine.has(b.id))
    .map((b) => ({ id: b.id, date: dateOf(b.id) }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  return candidates[0]?.id ?? null;
}
