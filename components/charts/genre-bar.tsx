import { Insufficient } from '../section';

type Row = { genre: string; count: number; share: number };

// 장르는 멤버 색과 겹치지 않게 같은 갈색의 농도 차로 구분하고, 이름과 권수를 글자로 적는다.
const SHADES = [100, 72, 52, 38, 26];
const shade = (i: number) => `color-mix(in srgb, var(--accent) ${SHADES[Math.min(i, SHADES.length - 1)]}%, var(--surface))`;

/** C6: 장르 분포 가로 100% 누적 막대. 5개를 넘으면 나머지는 "기타"로 묶는다. */
export function GenreBar({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <Insufficient>아직 읽은 책이 없어요</Insufficient>;
  const top = rows.slice(0, 4);
  const rest = rows.slice(4);
  const items = rest.length ? [...top, { genre: '기타', count: rest.reduce((s, r) => s + r.count, 0), share: rest.reduce((s, r) => s + r.share, 0) }] : top;
  return (
    <figure>
      <div role="img" aria-label={`장르 분포. ${items.map((r) => `${r.genre} ${r.count}권`).join(', ')}`} className="flex h-8 w-full gap-0.5 overflow-hidden rounded-md">
        {items.map((r, i) => (
          <div key={r.genre} title={`${r.genre} ${r.count}권 (${Math.round(r.share * 100)}%)`} className="h-full first:rounded-l-md last:rounded-r-md" style={{ width: `${r.share * 100}%`, backgroundColor: shade(i) }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {items.map((r, i) => (
          <li key={r.genre} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-sm border border-line" style={{ backgroundColor: shade(i) }} />
            {r.genre} <span className="text-muted tabular-nums">{r.count}권 · {Math.round(r.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
