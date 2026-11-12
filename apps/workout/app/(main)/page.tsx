import { isSiteLoggedIn } from '@me/core/server/require-site';
import { getDraft, getPrevSets } from '@/lib/data';
import { PARTS, type Part } from '@/lib/exercises';
import { APP_ID, PASSWORD_ENV } from '@/lib/site';
import AppShell from '@/components/app-shell';

/** 매번 새로 읽는다 (지난 기록·임시 저장은 캐시하면 안 된다) */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 게스트(로그인 안 한 사람): 내 기록·임시 저장은 읽지 않고 근육 지도만 보여 준다.
  if (!(await isSiteLoggedIn(APP_ID, PASSWORD_ENV))) {
    const empty = Object.fromEntries(PARTS.map((p) => [p, { prev: {}, date: null }])) as Record<Part, { prev: Record<string, never>; date: null }>;
    return <AppShell guest serverDraft={null} prevByPart={empty} />;
  }
  // 구분별 지난 기록과 진행 중 임시 저장을 서버에서 한꺼번에 읽어서 넘긴다 → 시작 버튼을 누르면 바로 채워진다
  const [draft, ...prevs] = await Promise.all([getDraft(), ...PARTS.map((p) => getPrevSets(p))]);
  const prevByPart = Object.fromEntries(PARTS.map((p, i) => [p, prevs[i]!])) as Record<Part, (typeof prevs)[number]>;
  return <AppShell serverDraft={draft} prevByPart={prevByPart} />;
}
