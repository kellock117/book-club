import { safeEqual } from '@me/core/auth/session';
import { BACKUP_BUCKET, backupFileName, exportAll, expiredBackups, isMonday } from '@me/core/backup';
import { ALL_BACKUP_TABLES } from '@me/core/backup-tables';
import { createAdminClient } from '@me/core/server/supabase';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron이 매일 한 번 호출한다.
 * - 매일: members 1행을 읽어 Supabase 무료 플랜의 비활동 일시 중지를 막는다.
 * - 월요일(또는 ?backup=1): 모든 앱의 테이블(core의 ALL_BACKUP_TABLES)을 JSON 하나로 backups 버킷에 저장하고, 12주가 지난 파일을 지운다.
 * Authorization: Bearer ${CRON_SECRET}이 아니면 401.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new Response('Unauthorized', { status: 401 });

  const db = createAdminClient();
  const now = new Date();

  const { error: pingErr } = await db.from('members').select('id').limit(1);
  if (pingErr) return Response.json({ ok: false, step: 'ping', error: pingErr.message }, { status: 500 });

  const forced = new URL(request.url).searchParams.get('backup') === '1';
  if (!forced && !isMonday(now)) return Response.json({ ok: true, ping: true, backup: null });

  try {
    const backup = await exportAll(db, ALL_BACKUP_TABLES, now);
    const name = backupFileName(now);
    const { error: upErr } = await db.storage
      .from(BACKUP_BUCKET)
      .upload(name, JSON.stringify(backup), { contentType: 'application/json', upsert: true });
    if (upErr) throw new Error(`업로드 실패: ${upErr.message}`);

    const { data: files, error: listErr } = await db.storage.from(BACKUP_BUCKET).list('', { limit: 1000 });
    if (listErr) throw new Error(`목록 읽기 실패: ${listErr.message}`);
    const old = expiredBackups((files ?? []).map((f) => f.name), now);
    if (old.length > 0) {
      const { error: rmErr } = await db.storage.from(BACKUP_BUCKET).remove(old);
      if (rmErr) throw new Error(`오래된 백업 삭제 실패: ${rmErr.message}`);
    }
    const counts = Object.fromEntries(Object.entries(backup.tables).map(([t, r]) => [t, r.length]));
    return Response.json({ ok: true, ping: true, backup: name, counts, deleted: old });
  } catch (e) {
    return Response.json({ ok: false, step: 'backup', error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
