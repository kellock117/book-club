import { NextResponse, type NextRequest } from 'next/server';
import { siteCookieName, verifySiteToken } from '@me/core/auth/site-lock';
import { APP_ID, PASSWORD_ENV } from '@/lib/site';

/**
 * 사이트 전체 잠금. (Next 16에서 middleware.ts는 proxy.ts로 이름이 바뀌었다.)
 * 이 앱의 서명된 쿠키(site_workout)가 없으면 /login으로 보낸다.
 * 단, 홈(/)은 게스트에게도 연다(근육 지도만 보이고 기록은 못 한다).
 * WORKOUT_PASSWORD가 없으면 검증이 항상 실패하므로 전부 잠긴다(안전한 쪽으로 실패).
 * 이 검사는 1차 방어선이다. 서버 액션은 주소로 직접 호출될 수 있어 액션에서도 requireSite()를 다시 부른다.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // 로그인 화면과 PWA 파일은 잠금 없이 연다(홈 화면 설치 때 브라우저가 쿠키 없이 가져간다)
  if (pathname === '/login') return NextResponse.next();

  const ok = verifySiteToken(APP_ID, request.cookies.get(siteCookieName(APP_ID))?.value, process.env[PASSWORD_ENV]);
  if (!ok) {
    if (pathname === '/') return NextResponse.next(); // 게스트에게는 홈(근육 지도)만 연다
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|icon.*|apple-icon.*).*)'],
};
