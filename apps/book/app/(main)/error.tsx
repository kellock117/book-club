'use client';

export default function MainError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 text-center">
      <h1 className="font-serif text-xl font-bold">서버가 잠들어 있어요</h1>
      <p className="text-sm text-muted">
        데이터를 불러오지 못했어요. 한동안 쓰지 않으면 데이터베이스가 일시 중지될 수 있어요. 관리자에게 알려 주세요. Supabase 대시보드에서 프로젝트를 다시 켜면
        데이터는 그대로 있어요.
      </p>
      <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink">
        다시 시도
      </button>
    </div>
  );
}
