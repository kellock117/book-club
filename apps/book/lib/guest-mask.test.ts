import { describe, expect, it } from 'vitest';
import { guestAlias, initialOf, maskClubData } from './guest-mask';

const data = {
  members: [
    { id: '1', name: '김가나', rotation_order: 1 },
    { id: '2', name: '이다라', rotation_order: 2 },
  ],
  ratings: [{ one_liner: '가나가 고른 책이라 기대했다', quote: null }],
  books: [{ title: '1984', recommend_reason: '이다라 추천' }],
};

describe('maskClubData', () => {
  it('멤버 이름을 순서대로 멤버 A, B로 바꾼다', () => {
    expect(maskClubData(data).members.map((m) => m.name)).toEqual(['멤버 A', '멤버 B']);
  });
  it('자유 글 속의 전체 이름과 성 뗀 이름도 바꾼다', () => {
    const out = maskClubData(data);
    expect(out.ratings[0]!.one_liner).toBe('멤버 A가 고른 책이라 기대했다');
    expect(out.books[0]!.recommend_reason).toBe('멤버 B 추천');
  });
  it('이름이 아닌 값(id, 책 제목)은 그대로 둔다', () => {
    const out = maskClubData(data);
    expect(out.members.map((m) => m.id)).toEqual(['1', '2']);
    expect(out.books[0]!.title).toBe('1984');
  });
  it('원본을 바꾸지 않는다', () => {
    maskClubData(data);
    expect(data.members[0]!.name).toBe('김가나');
  });
  it('rotation_order 순서가 알파벳을 정한다(배열 순서가 아니라)', () => {
    const out = maskClubData({ members: [{ name: '이다라', rotation_order: 2 }, { name: '김가나', rotation_order: 1 }] });
    expect(out.members.map((m) => m.name)).toEqual(['멤버 B', '멤버 A']);
  });
});

describe('guestAlias / initialOf', () => {
  it('26명을 넘으면 숫자를 쓴다', () => expect(guestAlias(26)).toBe('멤버 27'));
  it('이름표는 글자만, 실명은 첫 글자를 뽑는다', () => {
    expect(initialOf('멤버 A')).toBe('A');
    expect(initialOf('김가나')).toBe('김');
  });
});
