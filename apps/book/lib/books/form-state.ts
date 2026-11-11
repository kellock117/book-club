/** 책 입력 화면 공통 상태 (Server Action이 돌려주고 클라이언트 폼이 받는다) */
export type BookFormState = {
  errors?: Record<string, string[]>;
  /** 실패했을 때 입력값을 그대로 돌려 준다 */
  values?: Record<string, string>;
  /** 같은 ISBN의 책이 이미 있다 */
  duplicate?: { id: string; title: string; status: 'wishlist' | 'reading' | 'done'; interested: boolean };
};

export const BOOK_FIELD_NAMES = ['title', 'authors', 'translators', 'publisher', 'publishedDate', 'isbn13', 'pages', 'genre', 'description', 'coverUrl', 'infoSource'] as const;
