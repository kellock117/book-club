import { requireSite } from '@me/core/server/require-site';
import { APP_ID, PASSWORD_ENV } from '@/lib/site';

/** 로그인한 사람만 보는 영역. proxy.ts가 1차로 막고, 서버에서 한 번 더 확인한다. */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  await requireSite(APP_ID, PASSWORD_ENV);
  return children;
}
