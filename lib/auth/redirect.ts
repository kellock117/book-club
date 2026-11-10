/** 로그인 뒤 돌아갈 경로. 같은 사이트 안의 경로만 허용한다(오픈 리다이렉트 방지). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (next.startsWith('/login')) return '/';
  return next;
}
