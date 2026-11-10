/** 책 검색 어댑터(알라딘·카카오)가 공통으로 돌려주는 형태. 외부 API 필드명은 이 폴더 밖으로 나가지 않는다. */
export type BookCandidate = {
  isbn13: string | null;
  title: string; // 부제를 뗀 본제목
  authors: string[];
  translators: string[];
  publisher: string | null;
  publishedDate: string | null; // YYYY-MM-DD
  coverUrl: string | null;
  categoryName: string | null; // 알라딘 categoryName 원문
  description: string | null;
  pages: number | null; // 검색 응답에는 없고 ISBN 조회에만 있다
  source: 'aladin' | 'kakao';
};
