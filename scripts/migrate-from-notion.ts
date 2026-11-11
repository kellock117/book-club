/**
 * 노션 → Supabase 한 번 옮기기. 다시 실행해도 중복이 생기지 않는다(제목·회차·이름·(책,멤버) 기준 upsert).
 *
 *   npm run migrate:notion                              노션 API에서 읽어 옮긴다 (NOTION_TOKEN 필요)
 *   npm run migrate:notion -- --dump snap.json          노션에서 읽은 내용을 파일로 저장하고 끝낸다
 *   npm run migrate:notion -- --from-snapshot snap.json 노션 대신 저장해 둔 파일에서 읽는다
 *   --no-enrich                                         알라딘 보강을 건너뛴다
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { enrichBooks } from './migrate/enrich';
import { loadFromNotionApi } from './migrate/from-notion-api';
import { countRows, importSnapshot } from './migrate/import';
import { snapshotSchema } from './migrate/snapshot';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(name);

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`환경 변수 ${name}이(가) 비어 있음 (.env.local 확인)`);
  return v;
}

async function main() {
  const snapshotPath = arg('--from-snapshot');
  const dumpPath = arg('--dump');

  const snapshot = snapshotPath
    ? snapshotSchema.parse(JSON.parse(readFileSync(snapshotPath, 'utf8')))
    : snapshotSchema.parse(await loadFromNotionApi(need('NOTION_TOKEN')));

  console.log(
    `노션 데이터: 책 ${snapshot.books.length}, 멤버 ${snapshot.members.length}, 모임 ${snapshot.meetings.length}, 평점 ${snapshot.ratings.length}`,
  );
  if (dumpPath) {
    writeFileSync(dumpPath, JSON.stringify(snapshot, null, 2) + '\n');
    console.log(`저장함: ${dumpPath}`);
    return;
  }

  const db = createClient<Database>(need('SUPABASE_URL'), need('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await importSnapshot(db, snapshot);

  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (flag('--no-enrich')) console.log('알라딘 보강: 건너뜀(--no-enrich)');
  else if (!ttbKey) console.log('알라딘 보강: ALADIN_TTB_KEY가 없어 건너뜀. 키를 넣고 다시 실행하면 ISBN이 없는 책만 채운다.');
  else {
    const { enriched, skipped } = await enrichBooks(db, ttbKey);
    console.log(`알라딘 보강: ${enriched}권 완료${skipped.length ? `, 건너뜀 ${skipped.length}권 (${skipped.join(', ')})` : ''}`);
  }

  console.log('\n현재 행 수:', await countRows(db));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
