import { describe, expect, it } from 'vitest';
import {
  attendanceRate,
  bookAverage,
  daysBetween,
  disagreementByBook,
  fullMonthsBetween,
  generosityIndex,
  latestUnratedBook,
  meetingCount,
  memberAverage,
  monthsTogether,
  nextMeetingDday,
  nextSelector,
  overallAverage,
  pendingRatings,
  readBookCount,
  tasteDistance,
  todayInSeoul,
  totalPages,
  type StatsAttendee,
  type StatsBook,
  type StatsMeeting,
  type StatsMember,
  type StatsRating,
} from './stats';

// ───────────── 합성 데이터로 경계 확인 ─────────────

const m = (id: string, order: number, status: 'active' | 'pending' = 'active'): StatsMember => ({ id, name: id, rotationOrder: order, status });
const book = (id: string, over: Partial<StatsBook> = {}): StatsBook => ({ id, title: id, pages: null, status: 'done', selectedBy: null, ...over });
const meeting = (n: number, date: string, bookId: string | null): StatsMeeting => ({ id: `m${n}`, number: n, date, bookId });
const rate = (bookId: string, memberId: string, score: number): StatsRating => ({ bookId, memberId, score });

describe('날짜', () => {
  it('todayInSeoul: UTC 15시는 한국 다음 날 0시', () => {
    expect(todayInSeoul(new Date('2026-11-09T14:59:59Z'))).toBe('2026-11-09');
    expect(todayInSeoul(new Date('2026-11-09T15:00:00Z'))).toBe('2026-11-10');
  });
  it('daysBetween: 월·연 경계와 윤년', () => {
    expect(daysBetween('2026-11-10', '2026-12-08')).toBe(28);
    expect(daysBetween('2027-12-31', '2028-01-01')).toBe(1);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-11-10', '2026-11-01')).toBe(-9);
  });
  it('fullMonthsBetween: 일이 모자라면 한 달 덜 센다', () => {
    expect(fullMonthsBetween('2026-07-09', '2026-11-08')).toBe(3);
    expect(fullMonthsBetween('2026-07-09', '2026-11-09')).toBe(4);
    expect(fullMonthsBetween('2026-07-31', '2026-08-30')).toBe(0);
    expect(fullMonthsBetween('2026-11-10', '2026-07-09')).toBe(0);
  });
  it('잘못된 날짜 형식은 오류', () => {
    expect(() => daysBetween('2026/11/10', '2026-11-11')).toThrow();
  });
});

describe('요약 숫자', () => {
  it('모임 횟수는 오늘 포함, 미래 제외', () => {
    const ms = [meeting(1, '2026-07-09', null), meeting(2, '2026-11-10', null), meeting(3, '2026-12-08', null)];
    expect(meetingCount(ms, '2026-11-10')).toBe(2);
    expect(meetingCount(ms, '2026-07-08')).toBe(0);
  });
  it('모임이 없으면 함께한 기간 0, D-day null', () => {
    expect(monthsTogether([], '2026-11-10')).toBe(0);
    expect(nextMeetingDday([], '2026-11-10')).toBeNull();
  });
  it('D-day: 오늘 모임이면 0, 지난 모임만 있으면 null', () => {
    expect(nextMeetingDday([meeting(1, '2026-11-10', null)], '2026-11-10')).toBe(0);
    expect(nextMeetingDday([meeting(1, '2026-11-09', null)], '2026-11-10')).toBeNull();
  });
  it('총 쪽수: 완료 책만 더하고 쪽수 없는 책은 개수로 알린다', () => {
    const books = [book('a', { pages: 200 }), book('b', { pages: 300 }), book('c'), book('d', { pages: 999, status: 'reading' })];
    expect(totalPages(books)).toEqual({ pages: 500, missingCount: 1 });
    expect(totalPages([])).toEqual({ pages: 0, missingCount: 0 });
  });
});

describe('별점', () => {
  const ratings = [rate('a', 'x', 5), rate('a', 'y', 3), rate('b', 'x', 1)];
  it('책 평균과 평가 수, 평가 없으면 null', () => {
    expect(bookAverage(ratings, 'a')).toEqual({ avg: 4, n: 2 });
    expect(bookAverage(ratings, 'zzz')).toEqual({ avg: null, n: 0 });
  });
  it('전체 평균은 평점 행의 평균 (책 평균의 평균 아님)', () => {
    // 행 평균 = (5+3+1)/3 = 3, 책 평균의 평균 = (4+1)/2 = 2.5
    expect(overallAverage(ratings)).toBe(3);
    expect(overallAverage([])).toBeNull();
  });
  it('의견 차이: 평가 2개 이상만, 모집단 표준편차, 큰 순', () => {
    const rs = [rate('a', 'x', 5), rate('a', 'y', 3), rate('b', 'x', 1), rate('c', 'x', 4), rate('c', 'y', 4), rate('c', 'z', 4)];
    const d = disagreementByBook(rs);
    expect(d.map((x) => x.bookId)).toEqual(['a', 'c']);
    expect(d[0]!.stddev).toBeCloseTo(1, 10); // [5,3] → 모집단 표준편차 1 (표본이면 1.414)
    expect(d[1]!.stddev).toBe(0);
  });
});

describe('후함 지수', () => {
  it('다른 멤버 평균과의 차이 평균. 양수면 후하다', () => {
    const rs = [rate('a', 'x', 5), rate('a', 'y', 3), rate('b', 'x', 4), rate('b', 'y', 2), rate('b', 'z', 3)];
    // x: a는 5-3=+2, b는 4-2.5=+1.5 → 1.75
    expect(generosityIndex(rs, 'x')).toBeCloseTo(1.75, 10);
    // y: a는 3-5=-2, b는 2-3.5=-1.5 → -1.75
    expect(generosityIndex(rs, 'y')).toBeCloseTo(-1.75, 10);
  });
  it('비교할 다른 평가가 없는 책은 뺀다', () => {
    const rs = [rate('a', 'x', 5), rate('a', 'y', 3), rate('solo', 'x', 1)];
    expect(generosityIndex(rs, 'x')).toBeCloseTo(2, 10);
  });
  it('평점이 없는 멤버는 null', () => {
    expect(generosityIndex([rate('a', 'x', 5)], 'nobody')).toBeNull();
  });
});

describe('취향 거리', () => {
  it('공통 책이 3권 이상이면 별점 차이 절대값의 평균', () => {
    const rs = [rate('a', 'x', 5), rate('a', 'y', 4), rate('b', 'x', 2), rate('b', 'y', 4), rate('c', 'x', 3), rate('c', 'y', 3), rate('d', 'x', 5)];
    // 차이 1, 2, 0 → 평균 1 (d는 y가 안 읽어서 제외)
    expect(tasteDistance(rs, 'x', 'y')).toEqual({ status: 'ok', distance: 1, commonCount: 3 });
    expect(tasteDistance(rs, 'y', 'x')).toEqual({ status: 'ok', distance: 1, commonCount: 3 });
  });
  it('공통 책이 2권이면 데이터 부족', () => {
    const rs = [rate('a', 'x', 5), rate('a', 'y', 4), rate('b', 'x', 2), rate('b', 'y', 4)];
    expect(tasteDistance(rs, 'x', 'y')).toEqual({ status: 'insufficient', commonCount: 2 });
  });
});

describe('참석률', () => {
  const ms = [meeting(1, '2026-07-09', null), meeting(2, '2026-08-05', null), meeting(3, '2026-09-11', null), meeting(4, '2026-12-01', null)];
  const att = (meetingNo: number, memberId: string): StatsAttendee => ({ meetingId: `m${meetingNo}`, memberId });
  it('첫 참석 이후 지난 모임만 분모로 센다 (늦게 합류한 멤버가 손해 보지 않음)', () => {
    const attendees = [att(1, 'old'), att(2, 'old'), att(3, 'old'), att(2, 'late')];
    expect(attendanceRate('late', ms, attendees, '2026-10-01')).toEqual({ attended: 1, eligible: 2, rate: 0.5 });
    expect(attendanceRate('old', ms, attendees, '2026-10-01')).toEqual({ attended: 3, eligible: 3, rate: 1 });
  });
  it('중간에 빠진 모임은 분모에 들어간다', () => {
    const attendees = [att(1, 'x'), att(3, 'x')];
    expect(attendanceRate('x', ms, attendees, '2026-10-01')).toEqual({ attended: 2, eligible: 3, rate: 2 / 3 });
  });
  it('아직 오지 않은 모임은 분모에 넣지 않는다', () => {
    expect(attendanceRate('x', ms, [att(1, 'x')], '2026-07-09')).toEqual({ attended: 1, eligible: 1, rate: 1 });
  });
  it('한 번도 참석하지 않았으면 rate는 null', () => {
    expect(attendanceRate('ghost', ms, [], '2026-10-01')).toEqual({ attended: 0, eligible: 0, rate: null });
  });
});

describe('다음 선정자', () => {
  const members = [m('a', 1), m('b', 2), m('c', 3)];
  const books = [book('b1', { selectedBy: 'a' }), book('b2', { selectedBy: 'b' }), book('b3', { selectedBy: 'c' })];
  it('가장 최근 모임 책의 선정자 다음 순번', () => {
    const ms = [meeting(1, '2026-07-01', 'b1'), meeting(2, '2026-08-01', 'b2')];
    expect(nextSelector(members, books, ms)?.id).toBe('c');
  });
  it('마지막 순번이면 처음으로 돌아간다', () => {
    const ms = [meeting(1, '2026-07-01', 'b1'), meeting(2, '2026-08-01', 'b3')];
    expect(nextSelector(members, books, ms)?.id).toBe('a');
  });
  it('모임이 입력된 순서가 아니라 날짜로 최근을 정한다', () => {
    const ms = [meeting(2, '2026-08-01', 'b2'), meeting(1, '2026-07-01', 'b1')];
    expect(nextSelector(members, books, ms)?.id).toBe('c');
  });
  it('활동 중이 아닌 멤버는 건너뛴다', () => {
    const withPending = [m('a', 1), m('b', 2, 'pending'), m('c', 3)];
    const ms = [meeting(1, '2026-07-01', 'b1')];
    expect(nextSelector(withPending, books, ms)?.id).toBe('c');
  });
  it('마지막 선정자가 활동 중이 아니게 됐어도 순서값 기준으로 다음 사람을 고른다', () => {
    const members2 = [m('a', 1), m('b', 2, 'pending'), m('c', 3)];
    const ms = [meeting(1, '2026-07-01', 'b2')];
    expect(nextSelector(members2, books, ms)?.id).toBe('c');
  });
  it('선정자가 비어 있는 최근 책은 건너뛰고 그 전 모임을 본다', () => {
    const books2 = [book('b1', { selectedBy: 'a' }), book('nobody', { selectedBy: null })];
    const ms = [meeting(1, '2026-07-01', 'b1'), meeting(2, '2026-08-01', 'nobody')];
    expect(nextSelector(members, books2, ms)?.id).toBe('b');
  });
  it('모임이 없거나 선정자를 알 수 없으면 첫 순번', () => {
    expect(nextSelector(members, books, [])?.id).toBe('a');
    expect(nextSelector(members, [book('x', { selectedBy: 'ghost' })], [meeting(1, '2026-07-01', 'x')])?.id).toBe('a');
  });
  it('활동 중인 멤버가 없으면 null', () => {
    expect(nextSelector([m('a', 1, 'pending')], books, [])).toBeNull();
  });
  it('새로 합류한 멤버(active, 마지막 순번)가 순서에 반영된다', () => {
    const four = [...members, m('d', 4)];
    const ms = [meeting(1, '2026-07-01', 'b3')];
    expect(nextSelector(four, books, ms)?.id).toBe('d');
  });
});

describe('평점 대기', () => {
  it('완료 책만, 활동 중인 멤버 중 평점 없는 사람', () => {
    const members = [m('a', 1), m('b', 2), m('c', 3, 'pending')];
    const books = [book('done1'), book('reading1', { status: 'reading' }), book('wish', { status: 'wishlist' })];
    const ratings = [rate('done1', 'a', 4)];
    expect(pendingRatings(books, members, ratings)).toEqual([{ bookId: 'done1', missingMemberIds: ['b'] }]);
  });
  it('모두 남겼으면 빈 목록', () => {
    expect(pendingRatings([book('x')], [m('a', 1)], [rate('x', 'a', 3)])).toEqual([{ bookId: 'x', missingMemberIds: [] }]);
  });
});

describe('평점 화면의 기본 책', () => {
  const books = [book('old'), book('mid'), book('new'), book('reading', { status: 'reading' }), book('nomeeting')];
  const ms = [meeting(1, '2026-07-01', 'old'), meeting(2, '2026-08-01', 'mid'), meeting(3, '2026-09-01', 'new'), meeting(4, '2026-12-01', 'reading')];
  it('내가 안 남긴 완료 책 중 모임 날짜가 가장 늦은 책', () => {
    expect(latestUnratedBook(books, ms, [], 'x')).toBe('new');
  });
  it('이미 남긴 책은 건너뛴다', () => {
    expect(latestUnratedBook(books, ms, [rate('new', 'x', 4)], 'x')).toBe('mid');
  });
  it('다른 멤버가 남긴 평점은 내 기준에 영향이 없다', () => {
    expect(latestUnratedBook(books, ms, [rate('new', 'y', 4)], 'x')).toBe('new');
  });
  it('읽는 중인 책은 후보가 아니고, 모임이 없는 책은 맨 뒤', () => {
    const rated = [rate('old', 'x', 1), rate('mid', 'x', 1), rate('new', 'x', 1)];
    expect(latestUnratedBook(books, ms, rated, 'x')).toBe('nomeeting');
  });
  it('남길 책이 없으면 null', () => {
    const all = ['old', 'mid', 'new', 'nomeeting'].map((id) => rate(id, 'x', 3));
    expect(latestUnratedBook(books, ms, all, 'x')).toBeNull();
  });
});
