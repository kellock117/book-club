'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '@/lib/chart-data';
import { fmtScore } from '@/lib/format';
import { Insufficient } from '@me/ui/section';
import { TableView } from './table-view';

/** C3: 모임 회차별 평균 별점 추이. y축은 항상 0~5. */
export function TrendLine({ points, skipped }: { points: TrendPoint[]; skipped: number[] }) {
  if (points.length === 0) return <Insufficient>아직 평점이 쌓인 모임이 없어요</Insufficient>;
  return (
    <figure>
      <div role="img" aria-label={`모임 회차별 평균 별점. ${points.map((p) => `${p.number}회 ${fmtScore(p.avg)}점`).join(', ')}`} className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 224 }}>
          <LineChart data={points} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="number" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} tickFormatter={(v) => `${v}회`} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" padding={{ left: 12, right: 12 }} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" />
            <Tooltip
              cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }}
              labelFormatter={(v) => `${v}회`}
              formatter={(v, _n, item) => [`${fmtScore(Number(v))}점 (${(item.payload as TrendPoint).n}명)`, (item.payload as TrendPoint).title]}
            />
            <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2} dot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 7 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {skipped.length > 0 && <p className="mt-1 text-xs text-muted">{skipped.map((n) => `${n}회`).join(', ')}는 평점이 없어 점을 찍지 않았어요.</p>}
      <TableView caption="모임 회차별 평균 별점" head={['회차', '책', '평균', '평가 수']} rows={points.map((p) => [`${p.number}회`, p.title, fmtScore(p.avg), `${p.n}명`])} />
    </figure>
  );
}
