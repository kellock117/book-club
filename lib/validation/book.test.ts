import { describe, expect, it } from 'vitest';
import { bookFieldsSchema, meetingSchema, recommendSchema, selectExistingSchema } from './book';

const ID = 'bbbbbbbb-7feb-80aa-8a1d-c67ae5804206';
const ok = {
  title: '데미안',
  authors: '헤르만 헤세',
  translators: '전영애',
  publisher: '민음사',
  publishedDate: '2009-01-20',
  isbn13: '9788937460449',
  pages: '',
  genre: '',
  description: '',
  coverUrl: 'https://t1.daumcdn.net/lbook/image/540810',
  infoSource: 'kakao',
};

describe('bookFieldsSchema', () => {
  it('정상 입력', () => {
    expect(bookFieldsSchema.parse(ok)).toMatchObject({ title: '데미안', authors: ['헤르만 헤세'], isbn13: '9788937460449', pages: null, genre: null, description: null });
  });
  it('직접 입력은 제목만 있어도 된다', () => {
    const r = bookFieldsSchema.parse({ ...ok, authors: '', translators: '', publisher: '', publishedDate: '', isbn13: '', coverUrl: '', infoSource: 'manual' });
    expect(r).toMatchObject({ authors: [], isbn13: null, coverUrl: null, publishedDate: null });
  });
  it('ISBN·표지 주소·출처·날짜 검증', () => {
    expect(bookFieldsSchema.safeParse({ ...ok, isbn13: '123' }).success).toBe(false);
    expect(bookFieldsSchema.safeParse({ ...ok, coverUrl: 'https://evil.com/a.jpg' }).success).toBe(false);
    expect(bookFieldsSchema.safeParse({ ...ok, infoSource: 'aladin' }).success).toBe(false);
    expect(bookFieldsSchema.safeParse({ ...ok, publishedDate: '2009-13-40' }).success).toBe(false);
    expect(bookFieldsSchema.safeParse({ ...ok, title: ' ' }).success).toBe(false);
  });
});

describe('recommendSchema / selectExistingSchema', () => {
  it('추천 이유는 필수', () => {
    expect(recommendSchema.safeParse({ ...ok, reason: '' }).success).toBe(false);
    expect(recommendSchema.parse({ ...ok, reason: ' 좋아요 ' }).reason).toBe('좋아요');
  });
  it('선정: 책·선정자·이유·날짜가 모두 필요', () => {
    const base = { bookId: ID, selectedBy: ID, reason: '읽고 싶어서', date: '2026-12-08' };
    expect(selectExistingSchema.safeParse(base).success).toBe(true);
    expect(selectExistingSchema.safeParse({ ...base, date: '' }).success).toBe(false);
    expect(selectExistingSchema.safeParse({ ...base, reason: '' }).success).toBe(false);
    expect(selectExistingSchema.safeParse({ ...base, bookId: 'x' }).success).toBe(false);
  });
});

describe('meetingSchema', () => {
  const base = { id: ID, date: '2026-12-08', place: '', questions: '', attendees: [ID], intent: 'save' };
  it('빈 장소·질문은 null', () => {
    expect(meetingSchema.parse(base)).toMatchObject({ place: null, questions: null });
  });
  it('날짜·의도·참석자 id 검증', () => {
    expect(meetingSchema.safeParse({ ...base, date: '' }).success).toBe(false);
    expect(meetingSchema.safeParse({ ...base, intent: 'x' }).success).toBe(false);
    expect(meetingSchema.safeParse({ ...base, attendees: ['x'] }).success).toBe(false);
  });
});
