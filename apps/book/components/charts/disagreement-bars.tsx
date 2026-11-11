'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtScore } from '@/lib/format';
import { Insufficient } from '@me/ui/section';
import { TableView } from './table-view';

type Row = { bookId: string; title: string; stddev: number; n: number };

/** C5: 의견 차이 순위. 별점 표준편차(모집단)가 큰 책부터. */
export function DisagreementBars({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <Insufficient>평가가 2개 이상인 책이 아직 없어요</Insufficient>;
  const h = 44 + rows.length * 40;
  return (
    <figure>
      <div role="img" aria-label={`의견 차이 순위. ${rows.map((r) => `${r.title} ${fmtScore(r.stddev, 2)}`).join(', ')}`} style={{ height: h }} className="w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: h }}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={8}>
            <XAxis type="number" domain={[0, 2.5]} ticks={[0, 0.5, 1, 1.5, 2, 2.5]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" />
            <YAxis type="category" dataKey="title" width={92} tick={{ fill: 'var(--ink)', fontSize: 12 }} stroke="var(--line)" tickLine={false} interval={0} />
            <Tooltip cursor={{ fill: 'var(--line)', opacity: 0.4 }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} formatter={(v, _n, item) => [`${fmtScore(Number(v), 2)} (${(item.payload as Row).n}명)`, '표준편차']} />
            <Bar dataKey="stddev" fill="var(--accent)" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="stddev" position="right" formatter={(v) => fmtScore(Number(v), 2)} fill="var(--ink)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">값이 클수록 멤버들 점수가 많이 갈렸어요.</p>
      <TableView caption="책별 의견 차이" head={['책', '표준편차', '평가 수']} rows={rows.map((r) => [r.title, fmtScore(r.stddev, 2), `${r.n}명`])} />
    </figure>
  );
}
