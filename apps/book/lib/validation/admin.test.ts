import { describe, expect, it } from 'vitest';
import { bookEditSchema, memberSchema } from './admin';

const ID = 'bbbbbbbb-7feb-80aa-8a1d-c67ae5804206';

describe('memberSchema', () => {
  const ok = { name: '멤버A', rotationOrder: '2', color: '#8b5e3c', status: 'active' };
  it('정상 입력', () => {
    expect(memberSchema.parse(ok)).toEqual({ name: '멤버A', rotationOrder: 2, color: '#8b5e3c', status: 'active' });
  });
  it('이름이 비었거나 색 형식·상태·순서가 틀리면 거절', () => {
    expect(memberSchema.safeParse({ ...ok, name: '  ' }).success).toBe(false);
    expect(memberSchema.safeParse({ ...ok, color: 'red' }).success).toBe(false);
    expect(memberSchema.safeParse({ ...ok, color: '#fff' }).success).toBe(false);
    expect(memberSchema.safeParse({ ...ok, status: 'gone' }).success).toBe(false);
    expect(memberSchema.safeParse({ ...ok, rotationOrder: '0' }).success).toBe(false);
    expect(memberSchema.safeParse({ ...ok, rotationOrder: '1.5' }).success).toBe(false);
    expect(memberSchema.safeParse({ ...ok, rotationOrder: '' }).success).toBe(false);
  });
});

describe('bookEditSchema', () => {
  const ok = { id: ID, title: '데미안', authors: '헤르만 헤세, 공저자', translators: '', publisher: '', pages: '', genre: '', description: '' };
  it('쉼표 목록은 배열로, 빈 값은 null로', () => {
    expect(bookEditSchema.parse(ok)).toEqual({
      id: ID,
      title: '데미안',
      authors: ['헤르만 헤세', '공저자'],
      translators: [],
      publisher: null,
      pages: null,
      genre: null,
      description: null,
    });
  });
  it('쪽수·장르 검증', () => {
    expect(bookEditSchema.parse({ ...ok, pages: '240', genre: '소설' })).toMatchObject({ pages: 240, genre: '소설' });
    expect(bookEditSchema.safeParse({ ...ok, pages: '0' }).success).toBe(false);
    expect(bookEditSchema.safeParse({ ...ok, pages: 'abc' }).success).toBe(false);
    expect(bookEditSchema.safeParse({ ...ok, genre: '판타지' }).success).toBe(false);
  });
  it('제목이 비었거나 id가 uuid가 아니면 거절', () => {
    expect(bookEditSchema.safeParse({ ...ok, title: ' ' }).success).toBe(false);
    expect(bookEditSchema.safeParse({ ...ok, id: 'x' }).success).toBe(false);
  });
});
