/**
 * 로컬 Supabase의 데이터를 클라우드 프로젝트로 그대로 복사한다 (id·시각 보존, 다시 실행해도 중복 없음).
 * 원본은 .env.local의 SUPABASE_URL / SUPABASE_SECRET_KEY(로컬), 대상은 CLOUD_* 두 변수.
 *
 *   read -s CLOUD_SUPABASE_SECRET_KEY && export CLOUD_SUPABASE_SECRET_KEY   # 값이 기록에 남지 않게 입력
 *   CLOUD_SUPABASE_URL=https://<ref>.supabase.co npm run copy:cloud            # 실제 복사
 *   CLOUD_SUPABASE_URL=... npm run copy:cloud -- --dry                         # 건수만 확인
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@me/core/database';

// 외래 키 순서
const TABLES = ['book_members', 'book_books', 'book_meetings', 'book_meeting_attendees', 'book_ratings', 'book_interests'] as const;

function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`환경 변수 ${name}이(가) 비어 있음`);
  return v;
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

async function main() {
  const dry = process.argv.includes('--dry');
  const srcUrl = need('SUPABASE_URL');
  const dstUrl = need('CLOUD_SUPABASE_URL');
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(dstUrl)) throw new Error('CLOUD_SUPABASE_URL은 https://<ref>.supabase.co 형태여야 함');
  if (srcUrl === dstUrl) throw new Error('원본과 대상이 같음');

  const src = createClient<Database>(srcUrl, need('SUPABASE_SECRET_KEY'), opts);
  const dst = createClient<Database>(dstUrl, need('CLOUD_SUPABASE_SECRET_KEY'), opts);

  for (const t of TABLES) {
    const { data, error } = await src.from(t).select('*');
    if (error) throw new Error(`${t} 읽기 실패: ${error.message}`);
    const rows = data ?? [];
    const before = await dst.from(t).select('*', { count: 'exact', head: true });
    if (before.error) throw new Error(`${t} (클라우드) 확인 실패: ${before.error.message}`);
    if (dry || rows.length === 0) {
      console.log(`${t}: 원본 ${rows.length}행, 클라우드 ${before.count}행${dry ? ' (dry)' : ''}`);
      continue;
    }
    // 복합 기본 키 표(book_meeting_attendees, book_interests)는 기본 키로 알아서 맞추고, 나머지는 id로 맞춘다
    const compositeKey = t === 'book_meeting_attendees' || t === 'book_interests';
    const { error: upErr } = await dst.from(t).upsert(rows as never, compositeKey ? undefined : { onConflict: 'id' });
    if (upErr) throw new Error(`${t} 쓰기 실패: ${upErr.message}`);
    const after = await dst.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${rows.length}행 복사 → 클라우드 ${after.count}행`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
