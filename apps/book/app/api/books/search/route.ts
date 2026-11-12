import { NextResponse, type NextRequest } from 'next/server';
import { isLoggedIn } from '@/lib/auth/access';
import { searchBooks } from '@/lib/book-api';

/**
 * 책 검색. 사이트 잠금은 proxy.ts가 맡고, 외부 API 키는 서버에만 있다.
 * 결과는 fetch 단계에서 1일 캐시된다(같은 검색어).
 */
export async function GET(request: NextRequest) {
  // 외부 API 한도를 아끼려고 게스트는 쓰지 못한다 (proxy.ts도 막지만 여기서 한 번 더 확인)
  if (!(await isLoggedIn())) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1 || q.length > 100) return NextResponse.json({ books: [] });
  try {
    return NextResponse.json({ books: await searchBooks(q) });
  } catch {
    return NextResponse.json({ error: '검색에 실패했어요. 잠시 뒤에 다시 해 보거나 직접 입력해 주세요.' }, { status: 502 });
  }
}
