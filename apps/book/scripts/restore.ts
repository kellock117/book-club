/**
 * 백업 JSON을 DB에 넣는다. 기본은 "빈 DB에만" 복원하고, 데이터가 있으면 멈춘다.
 *
 *   pnpm --filter book restore -- backups/2026-11-16.json            # 빈 DB에 복원
 *   pnpm --filter book restore -- backups/2026-11-16.json --force    # 데이터가 있어도 같은 키는 덮어쓰며 복원
 *
 * 대상은 .env.local의 SUPABASE_URL / SUPABASE_SECRET_KEY 이다.
 */
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { countAll, parseBackup, restoreAll } from '@me/core/backup';
import { ALL_BACKUP_TABLES, BOOK_TABLES } from '@me/core/backup-tables';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) throw new Error('사용법: pnpm --filter book restore -- <백업파일.json> [--force]');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY가 .env.local에 없어요');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const backup = parseBackup(
    await readFile(file, 'utf8'),
    BOOK_TABLES.map((t) => t.name), // 독서 모임 테이블은 반드시 있어야 한다. 운동 테이블은 옛 백업에 없어도 된다
  );
  console.log(`대상: ${url}\n백업 시각: ${backup.createdAt}`);

  const before = await countAll(db, ALL_BACKUP_TABLES);
  const filled = ALL_BACKUP_TABLES.map((t) => t.name).filter((t) => (before[t] ?? 0) > 0);
  if (filled.length > 0 && !force) {
    throw new Error(`DB가 비어 있지 않아요 (${filled.map((t) => `${t} ${before[t]}`).join(', ')}). 덮어쓰려면 --force를 붙이세요`);
  }

  const restored = await restoreAll(db, backup, ALL_BACKUP_TABLES);
  const after = await countAll(db, ALL_BACKUP_TABLES);
  for (const { name } of ALL_BACKUP_TABLES) console.log(`${name.padEnd(18)} 백업 ${restored[name] ?? '없음'} → DB ${after[name]}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
