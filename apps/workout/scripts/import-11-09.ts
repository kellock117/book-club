/**
 * 아티팩트 시절 첫 기록(2026-11-09 하체)을 Supabase로 한 번 옮기는 일회성 스크립트.
 * 노션에 있던 값을 fixtures/2026-11-09-lower.json 에 옮겨 두었고, 이 스크립트가 그걸 DB에 넣는다.
 *
 *   pnpm --filter workout import:1109
 *
 * - 대상은 apps/workout/.env.local 의 SUPABASE_URL / SUPABASE_SECRET_KEY.
 * - 여러 번 실행해도 같은 결과다(세션 id로 upsert, 세트는 복합 키로 upsert).
 * - 시각 정보가 없어서 started_at / ended_at 은 비워 둔다. (휴식·총 시간은 계산할 수 없다)
 * - 이 기록은 다음 하체 운동 때 "지난 기록"으로 쓰여 세트 수·횟수를 채워 준다.
 */
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

interface Fixture {
  id: string;
  part: 'lower' | 'upper';
  date: string;
  finished: boolean;
  memo: string;
  sets: { exercise: string; reps: number[] }[];
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY가 apps/workout/.env.local에 없어요');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const fx = JSON.parse(await readFile(new URL('./fixtures/2026-11-09-lower.json', import.meta.url), 'utf8')) as Fixture;

  const s = await db.from('workout_sessions').upsert({ id: fx.id, part: fx.part, date: fx.date, finished: fx.finished, memo: fx.memo });
  if (s.error) throw new Error(`세션 저장 실패: ${s.error.message}`);

  const rows = fx.sets.flatMap((e, idx) =>
    e.reps.map((reps, k) => ({ session_id: fx.id, exercise: e.exercise, ord: idx + 1, set_no: k + 1, reps, unit: '회' })),
  );
  const t = await db.from('workout_sets').upsert(rows, { onConflict: 'session_id,ord,set_no' });
  if (t.error) throw new Error(`세트 저장 실패: ${t.error.message}`);

  console.log(`대상: ${url}\n${fx.date} ${fx.part} · 세트 ${rows.length}개 저장 (세션 ${fx.id})`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
