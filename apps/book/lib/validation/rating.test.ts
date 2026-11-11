import { describe, expect, it } from 'vitest';
import { ratingInputSchema } from './rating';

const BOOK = 'bbbbbbbb-7feb-80aa-8a1d-c67ae5804206';
const base = { bookId: BOOK, score: '3.5', oneLiner: '좋았다', quote: '' };

describe('ratingInputSchema', () => {
  it('정상 입력: 문자열 별점을 숫자로, 빈 문장은 null로', () => {
    const r = ratingInputSchema.parse(base);
    expect(r).toEqual({ bookId: BOOK, score: 3.5, oneLiner: '좋았다', quote: null });
  });
  it('0.5 단위가 아니면 거절 (0.7점)', () => {
    expect(ratingInputSchema.safeParse({ ...base, score: '0.7' }).success).toBe(false);
  });
  it('범위 밖이면 거절', () => {
    expect(ratingInputSchema.safeParse({ ...base, score: '0' }).success).toBe(false);
    expect(ratingInputSchema.safeParse({ ...base, score: '5.5' }).success).toBe(false);
  });
  it('경계값은 통과', () => {
    expect(ratingInputSchema.safeParse({ ...base, score: '0.5' }).success).toBe(true);
    expect(ratingInputSchema.safeParse({ ...base, score: '5' }).success).toBe(true);
  });
  it('별점이 비어 있으면 "골라 주세요" 메시지로 거절', () => {
    const empty = ratingInputSchema.safeParse({ ...base, score: '' });
    expect(empty.success).toBe(false);
    if (!empty.success) expect(empty.error.issues[0]?.message).toBe('별점을 골라 주세요');
    expect(ratingInputSchema.safeParse({ ...base, score: 'abc' }).success).toBe(false);
  });
  it('한 줄 평은 필수이고 80자까지 (공백만 있으면 비어 있는 것)', () => {
    expect(ratingInputSchema.safeParse({ ...base, oneLiner: '   ' }).success).toBe(false);
    expect(ratingInputSchema.safeParse({ ...base, oneLiner: 'a'.repeat(80) }).success).toBe(true);
    expect(ratingInputSchema.safeParse({ ...base, oneLiner: 'a'.repeat(81) }).success).toBe(false);
  });
  it('책 ID가 uuid가 아니면 거절', () => {
    expect(ratingInputSchema.safeParse({ ...base, bookId: 'nope' }).success).toBe(false);
  });
});
