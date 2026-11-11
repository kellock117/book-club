import { describe, expect, it } from 'vitest';
import { normalizeApiPages } from './from-notion-api';
import { cleanOneLiner, parseMeetingNumber, splitAuthors } from './import';
import { notionId, snapshotSchema } from './snapshot';

describe('parseMeetingNumber', () => {
  it('제목 "제N회 · …"에서 회차를 뽑는다', () => {
    expect(parseMeetingNumber('제1회 · 인간 실격')).toBe(1);
    expect(parseMeetingNumber('제12회 · 어떤 책')).toBe(12);
    expect(parseMeetingNumber('제 3 회')).toBe(3);
  });
  it('형식이 다르면 오류', () => {
    expect(() => parseMeetingNumber('인간 실격')).toThrow();
  });
});

describe('cleanOneLiner', () => {
  it('"멤버 · 책 제목" 임시값은 빈 값으로', () => {
    expect(cleanOneLiner('나래 · 인간 실격', '나래', '인간 실격')).toBeNull();
  });
  it('진짜 한 줄 평은 그대로 둔다', () => {
    expect(cleanOneLiner('  끝까지 읽기 힘들었다 ', '나래', '인간 실격')).toBe('끝까지 읽기 힘들었다');
  });
  it('빈 문자열은 null', () => {
    expect(cleanOneLiner('', '나래', '인간 실격')).toBeNull();
  });
});

describe('splitAuthors', () => {
  it('쉼표로 나눈다', () => {
    expect(splitAuthors('다자이 오사무')).toEqual(['다자이 오사무']);
    expect(splitAuthors('A, B')).toEqual(['A', 'B']);
    expect(splitAuthors('')).toEqual([]);
  });
});

describe('notionId', () => {
  it('URL과 하이픈 UUID에서 같은 ID를 뽑는다', () => {
    expect(notionId('https://app.notion.com/p/BBBBBBBB7FEB80AA8A1DC67AE5804206')).toBe('bbbbbbbb7feb80aa8a1dc67ae5804206');
    expect(notionId('bbbbbbbb-7feb-80aa-8a1d-c67ae5804206')).toBe('bbbbbbbb7feb80aa8a1dc67ae5804206');
  });
});


describe('normalizeApiPages (노션 API 모양, 손으로 만든 입력)', () => {
  const t = (s: string) => [{ plain_text: s }];
  it('속성을 스냅샷으로 바꾼다', () => {
    const snap = normalizeApiPages({
      members: [{ id: 'aaaaaaaa-7feb-815d-b62b-ec8a234cab7f', properties: { 이름: { title: t('가람') }, '선정 순서': { number: 1 }, 상태: { select: { name: '활동 중' } } } }],
      books: [
        {
          id: 'bbbbbbbb-7feb-80aa-8a1d-c67ae5804206',
          properties: {
            제목: { title: t('인간 실격') },
            저자: { rich_text: t('다자이 오사무') },
            장르: { select: { name: '소설' } },
            상태: { status: { name: '완료' } },
            쪽수: { number: null },
            '선정 이유': { rich_text: [] },
            '추천 이유': { rich_text: [] },
            선정자: { relation: [{ id: 'aaaaaaaa-7feb-815d-b62b-ec8a234cab7f' }] },
            추천자: { relation: [] },
            '나도 읽고 싶어요': { relation: [] },
          },
        },
      ],
      meetings: [
        {
          id: 'aaaaaaaa-7feb-8180-99e7-e47ff5614bf1',
          properties: {
            회차: { title: t('제1회 · 인간 실격') },
            날짜: { date: { start: '2026-07-09' } },
            장소: { rich_text: [] },
            '발제 질문': { rich_text: [] },
            책: { relation: [{ id: 'bbbbbbbb-7feb-80aa-8a1d-c67ae5804206' }] },
            참석자: { relation: [{ id: 'aaaaaaaa-7feb-815d-b62b-ec8a234cab7f' }] },
          },
        },
      ],
      ratings: [
        {
          id: 'aaaaaaaa-7feb-810b-a37b-ec5401c3802c',
          properties: {
            '한 줄 평': { title: t('나래 · 인간 실격') },
            별점: { number: 2 },
            '인상 깊은 문장': { rich_text: [] },
            책: { relation: [{ id: 'bbbbbbbb-7feb-80aa-8a1d-c67ae5804206' }] },
            멤버: { relation: [{ id: 'aaaaaaaa-7feb-815d-b62b-ec8a234cab7f' }] },
          },
        },
      ],
    });
    expect(() => snapshotSchema.parse(snap)).not.toThrow();
    expect(snap.books[0]).toMatchObject({ id: 'bbbbbbbb7feb80aa8a1dc67ae5804206', title: '인간 실격', status: '완료', genre: '소설', selectedBy: ['aaaaaaaa7feb815db62bec8a234cab7f'] });
    expect(snap.meetings[0]).toMatchObject({ date: '2026-07-09', bookIds: ['bbbbbbbb7feb80aa8a1dc67ae5804206'] });
    expect(snap.ratings[0]).toMatchObject({ score: 2, memberId: 'aaaaaaaa7feb815db62bec8a234cab7f' });
  });
});
