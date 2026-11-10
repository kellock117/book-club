'use client';

const STAR_PATH = 'M12 2.5l2.94 6.1 6.56.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6-4.8-4.6 6.56-.9L12 2.5z';

function Star({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="pointer-events-none relative block size-14">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-14 text-line" aria-hidden>
        <path d={STAR_PATH} fill="currentColor" />
      </svg>
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" className="size-14 max-w-none text-star" aria-hidden>
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

/**
 * 별 5개를 반 칸씩 눌러 0.5~5점을 고른다. 별은 왼쪽 절반이 x.5점, 오른쪽 절반이 x점.
 * 손가락으로 반 칸을 정확히 누르기 어려워서 −0.5 / +0.5 버튼(48px)도 함께 둔다.
 */
export function StarPicker({ value, onChange, describedBy, invalid }: { value: number; onChange: (v: number) => void; describedBy?: string; invalid?: boolean }) {
  const clamp = (v: number) => Math.min(5, Math.max(0.5, v));
  return (
    <div role="group" aria-label="별점" aria-describedby={describedBy} aria-invalid={invalid || undefined}>
      <div className="flex justify-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative size-14">
            <Star fill={value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0} />
            <button
              type="button"
              aria-label={`${i - 0.5}점`}
              aria-pressed={value === i - 0.5}
              onClick={() => onChange(i - 0.5)}
              className="absolute inset-y-0 left-0 w-1/2"
            />
            <button type="button" aria-label={`${i}점`} aria-pressed={value === i} onClick={() => onChange(i)} className="absolute inset-y-0 right-0 w-1/2" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="0.5점 내리기"
          disabled={value <= 0.5}
          onClick={() => onChange(clamp((value || 0.5) - 0.5))}
          className="size-12 rounded-full border border-line bg-surface text-xl font-bold disabled:opacity-40"
        >
          −
        </button>
        <output aria-live="polite" className="min-w-20 text-center font-serif text-3xl font-bold">
          {value ? value.toFixed(1) : '—'}
          <span className="ml-1 text-base font-normal text-muted">점</span>
        </output>
        <button
          type="button"
          aria-label="0.5점 올리기"
          disabled={value >= 5}
          onClick={() => onChange(clamp(value + 0.5))}
          className="size-12 rounded-full border border-line bg-surface text-xl font-bold disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
