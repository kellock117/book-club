import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | undefined;

/**
 * secret 키(sb_secret_…)로 붙는 서버 전용 클라이언트. 이 모듈은 `server-only`라서
 * 클라이언트 컴포넌트에서 import하면 빌드가 실패한다. 브라우저에는 어떤 키도 내보내지 않는다.
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 설정되지 않았어요');
  client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
