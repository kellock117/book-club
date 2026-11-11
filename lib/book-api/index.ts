import { searchKakao } from './kakao';
import type { BookCandidate } from './types';

export type { BookCandidate } from './types';

/**
 * 책 검색. 지금은 카카오만 쓴다(쪽수는 오지 않는다).
 * 국립중앙도서관 ISBN 서지정보 어댑터가 생기면 여기서 쪽수를 보강한다.
 */
export async function searchBooks(query: string): Promise<BookCandidate[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error('KAKAO_REST_API_KEY가 설정되지 않았어요');
  return searchKakao(key, query);
}
