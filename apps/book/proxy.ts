import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@me/core/auth/session';
import { MEMBER_COOKIE, SESSION_COOKIE } from '@/lib/auth/cookies';

/**
 * 사이트 전체 잠금. (Next 16에서 middleware.ts는 proxy.ts로 이름이 바뀌었다.)
 * 1) 서명된 세션 쿠키가 없으면 /login
 * 2) 로그인했지만 "나는 누구"를 아직 안 골랐으면 /who
 * SITE_PASSWORD가 없으면 검증이 항상 실패하므로 전부 잠긴다(안전한 쪽으로 실패).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/login') return NextResponse.next();

  const loggedIn = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, process.env.SITE_PASSWORD);
  if (!loggedIn) {
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
