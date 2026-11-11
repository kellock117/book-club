import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cleanTitle, parseKakaoDocument, pickCoverUrl, pickIsbn13, type KakaoDocument } from './kakao';

// 실제 응답(2026-11-11 저장)
const load = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as { documents: KakaoDocument[] };
const demian = load('kakao-search-데미안.json');
const nineteen = load('kakao-search-1984.json');

describe('카카오 실제 응답 → BookCandidate', () => {
  it('데미안 첫 결과', () => {
    const b = parseKakaoDocument(demian.documents[0]!);
    expect(b).toMatchObject({
      isbn13: '9788937460449',
      title: '데미안',
      authors: ['헤르만 헤세'],
      translators: ['전영애'],
      publisher: '민음사',
      publishedDate: '2009-01-20',
      pages: null,
      categoryName: null,
      source: 'kakao',
    });
    expect(b.description).toContain('싱클레어');
    expect(b.coverUrl).toBe('https://t1.daumcdn.net/lbook/image/540810?timestamp=20261023110741');
  });
  it('모든 결과가 제목과 13자리 ISBN을 가진다', () => {
    for (const d of [...demian.documents, ...nineteen.documents]) {
      const b = parseKakaoDocument(d);
      expect(b.title.length).toBeGreaterThan(0);
      expect(b.isbn13 === null || /^\d{13}$/.test(b.isbn13)).toBe(true);
    }
  });
  it('괄호 부제는 뗀다', () => {
    expect(parseKakaoDocument(demian.documents[1]!).title).toBe('데미안');
    expect(parseKakaoDocument(nineteen.documents[2]!).title).toBe('1984');
  });
});

describe('보조 함수', () => {
  it('cleanTitle', () => {
    expect(cleanTitle('데미안(초판본)(1919년 오리지널)')).toBe('데미안');
    expect(cleanTitle('어린 왕자 - 완역본')).toBe('어린 왕자');
    expect(cleanTitle('(괄호로 시작)')).toBe('(괄호로 시작)');
  });
  it('pickIsbn13: 10자리와 13자리 중 13자리만', () => {
    expect(pickIsbn13('8937460440 9788937460449')).toBe('9788937460449');
    expect(pickIsbn13(' 9788937460449')).toBe('9788937460449');
    expect(pickIsbn13('8937460440')).toBeNull();
    expect(pickIsbn13(undefined)).toBeNull();
  });
  it('pickCoverUrl: fname의 원본, 없으면 썸네일 그대로, 없으면 null', () => {
    expect(pickCoverUrl('https://x.kr/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Fa.jpg')).toBe('https://t1.daumcdn.net/a.jpg');
    expect(pickCoverUrl('https://x.kr/a.jpg')).toBe('https://x.kr/a.jpg');
    expect(pickCoverUrl('')).toBeNull();
    expect(pickCoverUrl(undefined)).toBeNull();
  });
});
