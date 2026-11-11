import { getDraft, getPrevSets } from '@/lib/data';
import { PARTS, type Part } from '@/lib/exercises';
import AppShell from '@/components/app-shell';

/** 매번 새로 읽는다 (지난 기록·임시 저장은 캐시하면 안 된다) */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 구분별 지난 기록과 진행 중 임시 저장을 서버에서 한꺼번에 읽어서 넘긴다 → 시작 버튼을 누르면 바로 채워진다
  const [draft, ...prevs] = await Promise.all([getDraft(), ...PARTS.map((p) => getPrevSets(p))]);
  const prevByPart = Object.fromEntries(PARTS.map((p, i) => [p, prevs[i]!])) as Record<Part, (typeof prevs)[number]>;
  return <AppShell serverDraft={draft} prevByPart={prevByPart} />;
}
