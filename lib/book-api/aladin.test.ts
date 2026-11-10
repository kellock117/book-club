import { describe, expect, it } from 'vitest';
import { parseAladinItem, parseAuthors, stripSubtitle } from './aladin';

// 주의: 아래 입력은 안내 문서를 보고 손으로 만든 예시다. 알라딘 TTB 키를 받으면
// 실제 응답을 lib/book-api/__fixtures__/에 저장하고 이 테스트를 그 파일로 바꾼다.
describe('stripSubtitle', () => {
  it('부제(" - …")를 뗀다', () => {
    expect(stripSubtitle('데미안 - 에밀 싱클레어의 청년 시절 이야기')).toBe('데미안');
    expect(stripSubtitle('1984')).toBe('1984');
    expect(stripSubtitle('가-나')).toBe('가-나');
  });
});

describe('parseAuthors', () => {
  it('저자와 역자를 나눈다', () => {
    expect(parseAuthors('다자이 오사무 (지은이), 김춘미 (옮긴이)')).toEqual({ authors: ['다자이 오사무'], translators: ['김춘미'] });
  });
  it('역할 표기가 없으면 저자', () => {
    expect(parseAuthors('김애란')).toEqual({ authors: ['김애란'], translators: [] });
  });
  it('그림·엮은이는 뺀다', () => {
    expect(parseAuthors('A (지은이), B (그림)')).toEqual({ authors: ['A'], translators: [] });
  });
  it('빈 값', () => {
    expect(parseAuthors(undefined)).toEqual({ authors: [], translators: [] });
  });
});

describe('parseAladinItem', () => {
  it('쪽수를 subInfo.itemPage에서 읽는다', () => {
    const c = parseAladinItem({
      title: '데미안 - 부제',
      author: '헤르만 헤세 (지은이), 전영애 (옮긴이)',
      publisher: '민음사',
      pubDate: '2000-12-20',
      isbn13: '9788937460449',
      cover: 'https://image.aladin.co.kr/x.jpg',
      categoryName: '국내도서>소설/시/희곡>독일소설',
      subInfo: { itemPage: 232 },
    });
    expect(c).toMatchObject({ title: '데미안', isbn13: '9788937460449', pages: 232, translators: ['전영애'], source: 'aladin' });
  });
  it('구형 bookinfo 위치도 받는다', () => {
    expect(parseAladinItem({ title: 'x', bookinfo: { itemPage: '300' } }).pages).toBe(300);
  });
  it('쪽수가 없거나 0이면 null', () => {
    expect(parseAladinItem({ title: 'x' }).pages).toBeNull();
    expect(parseAladinItem({ title: 'x', subInfo: { itemPage: 0 } }).pages).toBeNull();
  });
  it('13자리가 아닌 ISBN은 null', () => {
    expect(parseAladinItem({ title: 'x', isbn13: '8937460440' }).isbn13).toBeNull();
  });
});
