import { describe, expect, it } from 'vitest';
import { disagreementRows, generosityRows, genreShare, heatmapRows, meetingTrend, tasteMatrix } from './chart-data';
import type { StatsBook, StatsMeeting, StatsMember, StatsRating } from './stats';

const M = (id: string, order: number, status: 'active' | 'pending' = 'active'): StatsMember => ({ id, name: id, rotationOrder: order, status });
const B = (id: string, status: StatsBook['status'] = 'done'): StatsBook => ({ id, title: `책${id}`, pages: null, status, selectedBy: null });
const R = (bookId: string, memberId: string, score: number): StatsRating => ({ bookId, memberId, score });
const members = [M('a', 1), M('b', 2), M('c', 3)];

describe('heatmapRows', () => {
  it('완료 책만, 평점 없는 칸은 null', () => {
    const rows = heatmapRows([B('1'), B('2', 'reading')], members, [R('1', 'a', 4)]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.cells.map((c) => c.score)).toEqual([4, null, null]);
  });
  it('활동 중이 아닌 멤버는 열에서 뺀다', () => {
    const rows = heatmapRows([B('1')], [...members, M('d', 4, 'pending')], []);
    expect(rows[0]!.cells).toHaveLength(3);
  });
  it('데이터가 비어도 빈 배열', () => {
    expect(heatmapRows([], [], [])).toEqual([]);
  });
});

describe('meetingTrend', () => {
  const meetings: StatsMeeting[] = [
    { id: 'm1', number: 1, date: '2026-01-01', bookId: '1' },
    { id: 'm2', number: 2, date: '2026-02-01', bookId: '2' },
    { id: 'm3', number: 3, date: '2026-03-01', bookId: null },
  ];
  it('평점 없는 회차와 책 없는 회차는 건너뛴다', () => {
    const t = meetingTrend(meetings, [B('1'), B('2')], [R('1', 'a', 4), R('1', 'b', 3)]);
    expect(t.points).toEqual([{ number: 1, avg: 3.5, n: 2, title: '책1' }]);
    expect(t.skipped).toEqual([2, 3]);
  });
});

describe('generosityRows', () => {
  it('비교 대상이 없으면 null, 후한 사람이 위', () => {
    const rows = generosityRows(members, [R('1', 'a', 5), R('1', 'b', 3)]);
    expect(rows.map((r) => [r.memberId, r.value])).toEqual([['a', 2], ['b', -2], ['c', null]]);
  });
});

describe('disagreementRows', () => {
  it('평가 2개 이상만, 표준편차 큰 순', () => {
    const rows = disagreementRows([B('1'), B('2')], [R('1', 'a', 5), R('1', 'b', 1), R('2', 'a', 3), R('2', 'b', 4)]);
    expect(rows.map((r) => r.bookId)).toEqual(['1', '2']);
    expect(rows[0]!.stddev).toBe(2);
  });
});

describe('genreShare', () => {
  it('완료 책만 세고 장르 없으면 미분류', () => {
    const g = genreShare([
      { status: 'done', genre: '소설' },
      { status: 'done', genre: '소설' },
      { status: 'done', genre: null },
      { status: 'reading', genre: '시' },
    ]);
    expect(g.map((x) => [x.genre, x.count])).toEqual([['소설', 2], ['미분류', 1]]);
    expect(g[0]!.share).toBeCloseTo(2 / 3);
  });
  it('완료 책이 없으면 빈 배열', () => {
    expect(genreShare([])).toEqual([]);
  });
});

describe('tasteMatrix', () => {
  it('9칸, 대각선은 self, 공통 책이 모자라면 insufficient', () => {
    const t = tasteMatrix(members, [R('1', 'a', 4), R('1', 'b', 3)]);
    expect(t.cells).toHaveLength(9);
    expect(t.cells.find((c) => c.rowId === 'a' && c.colId === 'a')!.result).toBe('self');
    const ab = t.cells.find((c) => c.rowId === 'a' && c.colId === 'b')!.result;
    expect(typeof ab === 'object' && ab.status).toBe('insufficient');
  });
});
