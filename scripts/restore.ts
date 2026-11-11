/**
 * 백업 JSON을 DB에 넣는다. 기본은 "빈 DB에만" 복원하고, 데이터가 있으면 멈춘다.
 *
 *   npm run restore -- backups/2026-11-16.json            # 빈 DB에 복원
 *   npm run restore -- backups/2026-11-16.json --force    # 데이터가 있어도 같은 키는 덮어쓰며 복원
 *
 * 대상은 .env.local의 SUPABASE_URL / SUPABASE_SECRET_KEY 이다.
 */
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { BACKUP_TABLES, countAll, parseBackup, restoreAll } from '../lib/backup';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) throw new Error('사용법: npm run restore -- <백업파일.json> [--force]');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY가 .env.local에 없어요');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const backup = parseBackup(await readFile(file, 'utf8'));
  console.log(`대상: ${url}\n백업 시각: ${backup.createdAt}`);

  const before = await countAll(db);
  const filled = BACKUP_TABLES.filter((t) => before[t] > 0);
  if (filled.length > 0 && !force) {
    throw new Error(`DB가 비어 있지 않아요 (${filled.map((t) => `${t} ${before[t]}`).join(', ')}). 덮어쓰려면 --force를 붙이세요`);
  }

  const restored = await restoreAll(db, backup);
  const after = await countAll(db);
  for (const t of BACKUP_TABLES) console.log(`${t.padEnd(18)} 백업 ${restored[t]} → DB ${after[t]}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
