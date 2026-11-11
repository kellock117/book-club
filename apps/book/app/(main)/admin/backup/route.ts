import { isAdmin } from '@/lib/auth/admin';
import { BACKUP_BUCKET, backupFileName, exportAll, latestBackup } from '@me/core/backup';
import { ALL_BACKUP_TABLES } from '@me/core/backup-tables';
import { createAdminClient } from '@me/core/server/supabase';

export const dynamic = 'force-dynamic';

/** 백업 내려받기. 기본은 저장된 가장 최근 파일, ?fresh=1이면 지금 상태를 바로 내보낸다. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response('Forbidden', { status: 403 });
  const db = createAdminClient();
  const headers = (name: string) => ({
    'content-type': 'application/json; charset=utf-8',
    'content-disposition': `attachment; filename="${name}"`,
    'cache-control': 'no-store',
  });

  if (new URL(request.url).searchParams.get('fresh') !== '1') {
    const { data: files } = await db.storage.from(BACKUP_BUCKET).list('', { limit: 1000 });
    const name = latestBackup((files ?? []).map((f) => f.name));
    if (name) {
      const { data: blob, error } = await db.storage.from(BACKUP_BUCKET).download(name);
      if (!error && blob) return new Response(blob, { headers: headers(name) });
    }
  }
  const backup = await exportAll(db, ALL_BACKUP_TABLES);
  return new Response(JSON.stringify(backup, null, 2), { headers: headers(backupFileName(new Date())) });
}
