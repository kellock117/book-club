/**
 * 화면을 구성하는 기본 조각.
 * - Section: 제목이 있는 묶음
 * - Card: 테두리가 있는 상자
 * - Insufficient: 데이터가 모자랄 때 차트 대신 보여 주는 문구
 * 색은 앱의 테마 변수(--line, --surface, --muted)를 따라간다. 서버 컴포넌트와 클라이언트 컴포넌트 어디서나 쓸 수 있다.
 */
export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

/** 데이터가 모자랄 때 차트 대신 보여 주는 문구. */
export function Insufficient({ children = '아직 데이터가 부족해요' }: { children?: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">{children}</p>;
}
