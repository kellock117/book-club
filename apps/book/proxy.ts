import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@me/core/auth/session';
import { MEMBER_COOKIE, SESSION_COOKIE } from '@/lib/auth/cookies';

/**
 * 게스트(로그인 안 한 사람)가 볼 수 있는 "읽기" 화면.
 * 평점·선정·추천·모임 수정·관리자·"누구" 선택은 여기에 없으므로 게스트는 로그인으로 보내진다.
 * 새 읽기 화면을 만들면 여기에 추가해야 게스트에게 보인다(기본은 잠김).
 */
const GUEST_PAGES = [/^\/$/, /^\/books(\/[^/]+)?$/, /^\/meetings(\/[^/]+)?$/, /^\/members\/[^/]+$/, /^\/wishlist$/, /^\/rules$/];

/**
 * 사이트 전체 잠금. (Next 16에서 middleware.ts는 proxy.ts로 이름이 바뀌었다.)
 * 1) 서명된 세션 쿠키가 없으면 /login (단, GUEST_PAGES는 게스트에게 연다)
 * 2) 로그인했지만 "나는 누구"를 아직 안 골랐으면 /who
 * SITE_PASSWORD가 없으면 검증이 항상 실패하므로 전부 잠긴다(안전한 쪽으로 실패).
 *
 * 이 파일은 1차 방어선이다. 서버 액션은 어느 주소로든 호출될 수 있어서, 쓰기 보호는 액션 안(getCurrentMember)이 맡는다.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/login') return NextResponse.next();

  const loggedIn = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, process.env.SITE_PASSWORD);
  if (!loggedIn) {
    if (GUEST_PAGES.some((re) => re.test(pathname))) return NextResponse.next();
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname !== '/who' && !request.cookies.get(MEMBER_COOKIE)?.value) {
    const url = new URL('/who', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일은 제외한다. (이후 단계의 /api/cron은 Bearer 토큰으로 따로 검증하므로 여기서도 제외한다)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|api/cron).*)'],
};
