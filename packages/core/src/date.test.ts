import { describe, expect, it } from 'vitest';
import { daysBetween, todayInSeoul } from './date';

describe('날짜 계산', () => {
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
  it('형식이 다르면 예외', () => {
    expect(() => daysBetween('2026/11/10', '2026-11-11')).toThrow();
  });
});
