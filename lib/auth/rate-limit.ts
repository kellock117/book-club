/**
 * 메모리 기반 고정 창 제한. 서버리스에서는 인스턴스마다 따로 세므로 완전한 차단은 아니고
 * 친구끼리 쓰는 사이트의 무차별 대입을 늦추는 용도다.
 */
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number = Date.now(),
): { ok: true } | { ok: false; retryAfterMs: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterMs: windowMs - (now - recent[0]!) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return { ok: true };
}

/** 테스트용 초기화 */
export function resetRateLimit(): void {
  hits.clear();
}
