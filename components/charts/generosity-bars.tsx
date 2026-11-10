'use client';

import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtScore } from '@/lib/format';
import { Insufficient } from '../section';
import { TableView } from './table-view';

type Row = { memberId: string; name: string; value: number | null };

/** C4: 후함 지수. 0을 기준으로 오른쪽이 후함, 왼쪽이 짠 쪽. */
export function GenerosityBars({ rows, colors }: { rows: Row[]; colors: Record<string, string> }) {
  const shown = rows.filter((r): r is Row & { value: number } => r.value !== null);
  if (shown.length === 0) return <Insufficient>비교할 평점이 아직 부족해요</Insufficient>;
  const limit = Math.max(1, Math.ceil(Math.max(...shown.map((r) => Math.abs(r.value))) * 2) / 2);
  const missing = rows.filter((r) => r.value === null);
  const signed = (v: number) => `${v > 0 ? '+' : ''}${fmtScore(v, 2)}`;
  return (
    <figure>
      <div role="img" aria-label={`멤버 후함 지수. ${shown.map((r) => `${r.name} ${signed(r.value)}`).join(', ')}`} style={{ height: 56 + shown.length * 44 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 56 + shown.length * 44 }}>
          <BarChart data={shown} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={10}>
            <XAxis type="number" domain={[-limit, limit]} tickFormatter={(v) => signed(Number(v))} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" />
            <YAxis type="category" dataKey="name" width={56} tick={{ fill: 'var(--ink)', fontSize: 13 }} stroke="var(--line)" tickLine={false} />
            <ReferenceLine x={0} stroke="var(--ink)" />
            <Tooltip cursor={{ fill: 'var(--line)', opacity: 0.4 }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} formatter={(v) => [signed(Number(v)), '후함 지수']} />
            <Bar dataKey="value" radius={4} isAnimationActive={false}>
              {shown.map((r) => (
                <Cell key={r.memberId} fill={colors[r.memberId] ?? 'var(--accent)'} />
              ))}
              <LabelList dataKey="value" position="right" formatter={(v) => signed(Number(v))} fill="var(--ink)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">양수면 후하고 음수면 짜요. 다른 멤버 평균과 비교한 값이에요.</p>
      {missing.length > 0 && <p className="mt-1 text-xs text-muted">{missing.map((r) => r.name).join(', ')}: 비교할 평점이 아직 없어요.</p>}
      <TableView caption="멤버 후함 지수" head={['멤버', '후함 지수']} rows={rows.map((r) => [r.name, r.value === null ? '—' : signed(r.value)])} />
    </figure>
  );
}
