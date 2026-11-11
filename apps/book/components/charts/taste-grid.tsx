import { fmtScore } from '@/lib/format';
import type { TasteCell } from '@/lib/chart-data';
import { Insufficient } from '@me/ui/section';

type Col = { id: string; name: string; color: string };

/** C7: 멤버 × 멤버 취향 거리 격자. 값이 작을수록 진한 색(취향이 비슷). */
export function TasteGrid({ members, cells, highlightId }: { members: Col[]; cells: TasteCell[]; highlightId?: string }) {
  if (members.length < 2) return <Insufficient>멤버가 2명 이상이어야 비교할 수 있어요</Insufficient>;
  const anyOk = cells.some((c) => c.result !== 'self' && c.result.status === 'ok');
  return (
    <figure>
      {!anyOk && <Insufficient>아직 데이터가 부족해요. 둘 다 평가한 책이 3권 이상 있어야 해요.</Insufficient>}
      <div className={anyOk ? '' : 'mt-3'}>
        <table className="w-full border-separate border-spacing-0.5 text-sm">
          <caption className="sr-only">멤버 사이의 취향 거리. 숫자가 작을수록 취향이 비슷합니다.</caption>
          <thead>
            <tr>
              <td />
              {members.map((m) => (
                <th key={m.id} scope="col" className="px-1 pb-1 text-center text-xs font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={`px-1 text-left text-xs font-medium ${row.id === highlightId ? 'text-accent' : ''}`}>
                  {row.name}
                </th>
                {members.map((col) => {
                  const r = cells.find((c) => c.rowId === row.id && c.colId === col.id)!.result;
                  if (r === 'self') return <td key={col.id} className="h-12 rounded-md bg-line/40 text-center text-muted" aria-label="본인">·</td>;
                  if (r.status === 'insufficient')
                    return (
                      <td key={col.id} title={`${row.name}·${col.name}: 공통 책 ${r.commonCount}권`} className="h-12 rounded-md border border-dashed border-line text-center text-[11px] leading-tight text-muted">
                        데이터 부족
                      </td>
                    );
                  const mix = Math.round(8 + (1 - Math.min(r.distance, 4.5) / 4.5) * 37);
                  return (
                    <td key={col.id} title={`${row.name}·${col.name}: 거리 ${fmtScore(r.distance, 2)} (공통 ${r.commonCount}권)`} className="h-12 rounded-md text-center font-semibold tabular-nums" style={{ backgroundColor: `color-mix(in srgb, var(--accent) ${mix}%, var(--surface))` }}>
                      {fmtScore(r.distance, 2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">두 사람이 둘 다 평가한 책에서 별점 차이의 평균이에요. 작을수록 비슷해요.</p>
    </figure>
  );
}
