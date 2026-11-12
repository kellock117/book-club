/**
 * 백업·복원 도구. 어떤 테이블을 다룰지는 `backup-tables.ts`의 표(TableSpec 목록)로 정한다.
 *
 * 쓰는 곳: 매일 한국 시간 00시에 도는 크론(apps/book의 /api/cron/daily), 관리자 화면의 백업 내려받기,
 * 복원 스크립트(apps/book/scripts/restore.ts).
 * 서버(크론)와 스크립트가 함께 쓰므로 `server-only`나 `@/` 별칭을 쓰지 않는다.
 *
 * 백업 파일은 JSON 하나: `{ version: 1, createdAt, tables: { 테이블이름: [행, …] } }`.
 * 앱을 새로 추가하기 전에 만든 옛 백업에는 새 테이블이 없다. 복원은 "파일에 있는 테이블만" 넣어서 그래도 동작한다.
 */
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { todayInSeoul } from './date';

/** 백업 대상 테이블 하나. */
export type TableSpec = {
  name: string;
  /** 복원(upsert)할 때 같은 행으로 볼 열. 복합 키는 쉼표로 잇는다. */
  conflictKey: string;
};

export const BACKUP_BUCKET = 'backups';
export const BACKUP_KEEP_WEEKS = 12;
/** supabase-js 한 번의 select가 돌려주는 상한. 이 크기로 나눠 읽는다. */
const SELECT_LIMIT = 1000;
/** 한 테이블에서 읽을 최대 행 수(무한 반복 방지 안전장치). */
const MAX_ROWS = 100_000;

const backupSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});
export type Backup = z.infer<typeof backupSchema>;

/**
 * 백업 파일 내용을 읽어 검증한다.
 * @param required 반드시 들어 있어야 하는 테이블 이름. 없으면 이유와 함께 거절한다.
 * @param renames 옛 테이블 이름 → 새 이름. 이름 규칙이 바뀌기 전에 만든 백업을 읽을 때 쓴다
 *                (이미 새 이름이 있으면 그대로 두고, 옛 이름은 무시한다).
 */
export function parseBackup(text: string, required: readonly string[] = [], renames: Readonly<Record<string, string>> = {}): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('백업 파일이 올바른 JSON이 아니에요');
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) throw new Error(`백업 파일 형식이 맞지 않아요: ${parsed.error.issues[0]?.path.join('.') ?? ''}`);
  const tables: Backup['tables'] = {};
  for (const [name, rows] of Object.entries(parsed.data.tables)) {
    const next = renames[name] ?? name;
    if (next !== name && next in parsed.data.tables) continue; // 새 이름이 이미 있으면 그쪽을 쓴다
    tables[next] = rows;
  }
  const missing = required.find((t) => !(t in tables));
  if (missing) throw new Error(`백업 파일 형식이 맞지 않아요: tables.${missing}`);
  return { ...parsed.data, tables };
}

const FILE_RE = /^(\d{4})-(\d{2})-(\d{2})\.json$/;

/** `YYYY-MM-DD.json` (한국 날짜). 한국 00시에 돌면 그날 날짜의 파일이 된다. */
export function backupFileName(date: Date): string {
  return `${todayInSeoul(date)}.json`;
}

/** 보관 기간(주)을 넘긴 백업 파일 이름. 형식이 다른 파일은 건드리지 않는다. */
export function expiredBackups(names: string[], now: Date, weeks: number = BACKUP_KEEP_WEEKS): string[] {
  const cutoff = now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000;
  return names.filter((n) => {
    const m = FILE_RE.exec(n);
    if (!m) return false;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) < cutoff;
  });
}

/** 가장 최근 백업 파일 이름(없으면 null). */
export function latestBackup(names: string[]): string | null {
  const valid = names.filter((n) => FILE_RE.test(n)).sort();
  return valid.at(-1) ?? null;
}

// supabase-js의 제네릭이 테이블 이름마다 달라 문자열 테이블을 다룰 때는 느슨한 타입을 쓴다.
type AnyClient = SupabaseClient<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** 한 테이블을 페이지 단위로 끝까지 읽는다. 행이 겹치거나 빠지지 않도록 conflictKey 열로 정렬한다. */
export async function fetchAllRows(db: AnyClient, spec: TableSpec, pageSize: number = SELECT_LIMIT): Promise<Record<string, unknown>[]> {
  const orderCols = spec.conflictKey.split(',').map((c) => c.trim());
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    if (from >= MAX_ROWS) throw new Error(`${spec.name}가 ${MAX_ROWS}행을 넘었어요. 백업 방식을 다시 검토해야 해요`);
    let q = db.from(spec.name).select('*');
    for (const c of orderCols) q = q.order(c);
    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) throw new Error(`${spec.name} 읽기 실패: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) return rows;
  }
}

/** 표에 있는 모든 테이블을 읽어 백업 객체를 만든다. */
export async function exportAll(db: AnyClient, specs: readonly TableSpec[], now: Date = new Date()): Promise<Backup> {
  const tables: Backup['tables'] = {};
  for (const spec of specs) tables[spec.name] = await fetchAllRows(db, spec);
  return { version: 1, createdAt: now.toISOString(), tables };
}

/** 표에 있는 모든 테이블의 행 수. 복원 전에 DB가 비어 있는지 확인할 때 쓴다. */
export async function countAll(db: AnyClient, specs: readonly TableSpec[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const { name } of specs) {
    const { count, error } = await db.from(name).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`${name} 세기 실패: ${error.message}`);
    counts[name] = count ?? 0;
  }
  return counts;
}

/**
 * 백업을 DB에 넣는다. 같은 키가 있으면 덮어쓰므로 두 번 실행해도 개수가 같다.
 * 백업 파일에 없는 테이블(앱을 추가하기 전의 옛 백업)은 건너뛴다.
 * @returns 테이블별로 넣은 행 수
 */
export async function restoreAll(db: AnyClient, backup: Backup, specs: readonly TableSpec[]): Promise<Record<string, number>> {
  const done: Record<string, number> = {};
  for (const { name, conflictKey } of specs) {
    const data = backup.tables[name];
    if (!data) continue;
    for (let i = 0; i < data.length; i += 500) {
      const { error } = await db.from(name).upsert(data.slice(i, i + 500), { onConflict: conflictKey });
      if (error) throw new Error(`${name} 복원 실패: ${error.message}`);
    }
    done[name] = data.length;
  }
  return done;
}
