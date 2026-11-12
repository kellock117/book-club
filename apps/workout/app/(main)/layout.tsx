/**
 * 로그인 확인은 proxy.ts(1차)와 page.tsx·서버 액션(requireSite)이 한다.
 * 로그인 안 한 사람(게스트)도 홈까지는 들어오지만, page.tsx가 읽기 화면(근육 지도)만 그린다.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
