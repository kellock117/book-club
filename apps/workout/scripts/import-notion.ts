/**
 * 노션 🏋️ 운동 기록에 있던 과거 운동을 Supabase로 한 번 옮기는 일회성 스크립트.
 * 노션 값을 fixtures/*.json 에 옮겨 두었고, 이 스크립트가 fixtures 폴더의 모든 파일을 DB에 넣는다.
 *
 *   pnpm --filter workout import:notion
 *
 * - 대상은 apps/workout/.env.local 의 SUPABASE_URL / SUPABASE_SECRET_KEY.
 * - 여러 번 실행해도 같은 결과다(세션 id로 upsert, 세트는 복합 키로 upsert).
 * - 세트 형식은 두 가지다.
 *   · reps: 횟수 배열만 있는 것 (11/09 하체: 시각 없음 → 휴식·총 시간을 계산할 수 없다)
 *   · rows: 세트마다 reps/start/end("HH:MM:SS", 서울 시각)가 있는 것 (11/11 상체)
 * - 이 기록은 다음 같은 구분 운동 때 "지난 기록"으로 쓰여 세트 수·횟수를 채워 준다.
 * - 운동 이름은 지금 앱(lib/exercises.ts)의 이름이어야 지난 기록과 맞는다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

interface Row {
  reps: number;
  start?: string;
  end?: string;
}
interface Fixture {
  id: string;
  part: 'lower' | 'upper';
  date: string;
  startedAt?: string;
  endedAt?: string;
  finished: boolean;
  memo: string;
  sets: { exercise: string; reps?: number[]; rows?: Row[] }[];
}

/** 서울(UTC+9) 날짜 + "HH:MM:SS" → ISO 문자열. 없으면 null. */
const seoulTime = (date: string, t?: string) => (t ? `${date}T${t}+09:00` : null);

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY가 apps/workout/.env.local에 없어요');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const dir = new URL('./fixtures/', import.meta.url);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();

  for (const file of files) {
    const fx = JSON.parse(await readFile(new URL(file, dir), 'utf8')) as Fixture;

    const s = await db.from('workout_sessions').upsert({
      id: fx.id,
      part: fx.part,
      date: fx.date,
      started_at: fx.startedAt ?? null,
      ended_at: fx.endedAt ?? null,
      finished: fx.finished,
      memo: fx.memo,
    });
    if (s.error) throw new Error(`${file} 세션 저장 실패: ${s.error.message}`);

    const rows = fx.sets.flatMap((e, idx) => {
      const list: Row[] = e.rows ?? (e.reps ?? []).map((reps) => ({ reps }));
      return list.map((r, k) => ({
        session_id: fx.id,
        exercise: e.exercise,
        ord: idx + 1,
        set_no: k + 1,
        reps: r.reps,
        unit: '회',
        started_at: seoulTime(fx.date, r.start),
        ended_at: seoulTime(fx.date, r.end),
      }));
    });
    const t = await db.from('workout_sets').upsert(rows, { onConflict: 'session_id,ord,set_no' });
    if (t.error) throw new Error(`${file} 세트 저장 실패: ${t.error.message}`);

    console.log(`${fx.date} ${fx.part} · 세트 ${rows.length}개 저장 (세션 ${fx.id})`);
  }
  console.log(`대상: ${url}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
