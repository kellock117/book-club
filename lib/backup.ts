import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 백업·복원. 서버(크론, /admin)와 scripts/restore.ts가 함께 쓰므로
 * `@/` 별칭이나 server-only를 쓰지 않는다.
 */

/** 외래 키 순서: 앞쪽 테이블이 먼저 들어가야 한다(지울 때는 거꾸로). */
export const BACKUP_TABLES = ['members', 'books', 'meetings', 'meeting_attendees', 'ratings', 'book_interests'] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

/** 연결 테이블은 id 열이 없고 복합 키다. */
const CONFLICT_KEYS: Record<BackupTable, string> = {
  members: 'id',
  books: 'id',
  meetings: 'id',
  meeting_attendees: 'meeting_id,member_id',
  ratings: 'id',
  book_interests: 'book_id,member_id',
};

export const BACKUP_BUCKET = 'backups';
export const BACKUP_KEEP_WEEKS = 12;
/** supabase-js 한 번의 select가 돌려주는 기본 상한. 이만큼 오면 잘렸을 수 있다. */
const SELECT_LIMIT = 1000;

const rows = z.array(z.record(z.string(), z.unknown()));
const backupSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  tables: z.object({
    members: rows,
    books: rows,
    meetings: rows,
    meeting_attendees: rows,
    ratings: rows,
    book_interests: rows,
  }),
});
export type Backup = z.infer<typeof backupSchema>;

export function parseBackup(text: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('백업 파일이 올바른 JSON이 아니에요');
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) throw new Error(`백업 파일 형식이 맞지 않아요: ${parsed.error.issues[0]?.path.join('.') ?? ''}`);
  return parsed.data;
}

const FILE_RE = /^(\d{4})-(\d{2})-(\d{2})\.json$/;

/** `YYYY-MM-DD.json` (UTC 날짜) */
export function backupFileName(date: Date): string {
  return `${date.toISOString().slice(0, 10)}.json`;
}

/** 월요일(UTC)인가. 크론이 UTC 00:00에 돌므로 한국 시간으로도 월요일 오전이다. */
export function isMonday(date: Date): boolean {
  return date.getUTCDay() === 1;
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

export async function exportAll(db: AnyClient, now: Date = new Date()): Promise<Backup> {
  const tables = {} as Record<BackupTable, Record<string, unknown>[]>;
  for (const t of BACKUP_TABLES) {
    const { data, error } = await db.from(t).select('*');
    if (error) throw new Error(`${t} 읽기 실패: ${error.message}`);
    if ((data?.length ?? 0) >= SELECT_LIMIT) throw new Error(`${t}가 ${SELECT_LIMIT}행 이상이라 백업이 잘릴 수 있어요. 페이지 단위 읽기를 추가해야 해요`);
    tables[t] = data ?? [];
  }
  return { version: 1, createdAt: now.toISOString(), tables };
}

/** 모든 테이블의 행 수. 비어 있는지 확인할 때 쓴다. */
export async function countAll(db: AnyClient): Promise<Record<BackupTable, number>> {
  const counts = {} as Record<BackupTable, number>;
  for (const t of BACKUP_TABLES) {
    const { count, error } = await db.from(t).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`${t} 세기 실패: ${error.message}`);
    counts[t] = count ?? 0;
  }
  return counts;
}

/** 백업을 DB에 넣는다. 같은 키가 있으면 덮어쓰므로 두 번 실행해도 개수가 같다. */
export async function restoreAll(db: AnyClient, backup: Backup): Promise<Record<BackupTable, number>> {
  const done = {} as Record<BackupTable, number>;
  for (const t of BACKUP_TABLES) {
    const data = backup.tables[t];
    for (let i = 0; i < data.length; i += 500) {
      const { error } = await db.from(t).upsert(data.slice(i, i + 500), { onConflict: CONFLICT_KEYS[t] });
      if (error) throw new Error(`${t} 복원 실패: ${error.message}`);
    }
    done[t] = data.length;
  }
  return done;
}
