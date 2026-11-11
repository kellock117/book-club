import Link from 'next/link';
import { fmtScore } from '@/lib/format';
import type { HeatmapRow } from '@/lib/chart-data';
import { Insufficient } from '@me/ui/section';

type Col = { id: string; name: string; color: string };

/** 점수 → 배경 농도. 값은 칸 안에 숫자로도 적으므로 색에만 기대지 않는다. */
export const scoreShade = (score: number) => `color-mix(in srgb, var(--accent) ${Math.round(8 + (score / 5) * 37)}%, var(--surface))`;

/** C1: 책 × 멤버 별점표. 빈 칸은 "대기". */
export function Heatmap({ rows, members }: { rows: HeatmapRow[]; members: Col[] }) {
  if (rows.length === 0) return <Insufficient>아직 평점을 받은 책이 없어요</Insufficient>;
  return (
    <figure>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-sm">
          <caption className="sr-only">책과 멤버별 별점. 평점을 아직 남기지 않은 칸은 대기로 표시합니다.</caption>
          <thead>
            <tr>
              <th scope="col" className="px-1 pb-1 text-left text-xs font-medium text-muted">
                책
              </th>
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
            {rows.map((r) => (
              <tr key={r.bookId}>
                <th scope="row" className="max-w-[7rem] px-1 py-0.5 text-left text-xs font-medium">
                  <Link href={`/books/${r.bookId}`} className="line-clamp-2 py-2 underline-offset-2 hover:underline">
                    {r.title}
                  </Link>
                </th>
                {r.cells.map((c) => (
                  <td
                    key={c.memberId}
                    title={`${members.find((m) => m.id === c.memberId)?.name} · ${r.title} · ${c.score === null ? '평점 대기' : `${fmtScore(c.score)}점`}`}
                    className={`h-11 min-w-12 rounded-md text-center tabular-nums ${c.score === null ? 'border border-dashed border-line text-xs text-muted' : 'font-semibold'}`}
                    style={c.score === null ? undefined : { backgroundColor: scoreShade(c.score) }}
                  >
                    {c.score === null ? '대기' : fmtScore(c.score)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
