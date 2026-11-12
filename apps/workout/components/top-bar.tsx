/**
 * 화면 위에 고정되는 바: [근육 지도 | 운동 기록] 탭 + 도움말(?) 버튼, 그 아래 화면별 줄(children).
 * 지도 화면은 운동 선택기를, 기록 화면은 타이머 줄을 children으로 넣는다.
 *
 * guest(로그인 안 한 사람)에게는 "운동 기록" 탭이 없고, 우측 상단에 로그인 버튼이 뜬다.
 * 로그인하면 원래 보던 화면으로 돌아와 기록 탭이 열린다.
 */
import { GuestLogin } from '@me/ui/guest-login';

export type Tab = 'map' | 'log';

export function TopBar({ tab, onTab, onHelp, guest = false, children }: { tab: Tab; onTab: (t: Tab) => void; onHelp: () => void; guest?: boolean; children?: React.ReactNode }) {
  return (
    <div className="bar">
      <div className="top">
        <div className="tabs" role="tablist" aria-label="화면">
          <button type="button" role="tab" aria-selected={tab === 'map'} onClick={() => onTab('map')}>
            근육 지도
          </button>
          {!guest && (
            <button type="button" role="tab" aria-selected={tab === 'log'} onClick={() => onTab('log')}>
              운동 기록
            </button>
          )}
        </div>
        {guest && <GuestLogin />}
        <button type="button" className="help" aria-label="운동 가이드 보기" onClick={onHelp}>
          ?
        </button>
      </div>
      {children}
    </div>
  );
}
