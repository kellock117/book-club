import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 표지 복사. 브라우저가 보낸 주소를 서버가 내려받으므로 허용한 이미지 서버만 받는다(SSRF 방지).
 * 서버 코드와 테스트가 함께 쓰므로 `@/` 별칭과 server-only를 쓰지 않는다.
 */
const ALLOWED_HOST_SUFFIXES = ['daumcdn.net', 'kakaocdn.net'];
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function isAllowedCoverUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    return ALLOWED_HOST_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

/** 표지를 내려받아 Storage covers/{bookId}.{ext}에 저장하고 경로를 돌려준다. 실패하면 null(자동 표지를 쓴다). */
export async function copyCover(db: SupabaseClient<any, any, any>, bookId: string, url: string): Promise<string | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!isAllowedCoverUrl(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') ?? '').split(';')[0]!.trim();
    const ext = EXT[type];
    if (!ext) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
    const path = `${bookId}.${ext}`;
    const { error } = await db.storage.from('covers').upload(path, bytes, { contentType: type, upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}
