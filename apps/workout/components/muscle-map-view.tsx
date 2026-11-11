'use client';

/**
 * 근육 지도 화면: 운동을 고르면 앞·뒤 몸 그림에서 쓰이는 근육이 강도별로 칠해지고,
 * 아래에 근육 목록과 "신경 쓸 점"이 나온다. 근육(그림 또는 목록)을 누르면 이름이 나온다.
 *
 * 그림 데이터(body-paths)와 종목 데이터가 커서 app-shell에서 next/dynamic으로 이 탭을 열 때만 불러온다.
 * 선택한 종목은 부모(app-shell)가 들고 있다가 기록 화면의 "근육 지도 보기"로도 바꾼다.
 */
import { useMemo, useState } from 'react';
import { BACK, FRONT, type BodyPath } from '@/lib/body-paths';
import { LEVEL_LABEL, MAP_ENTRIES, MUSCLE_NAMES, PART_LABEL, PARTS, type Level, type MuscleKey } from '@/lib/exercises';
import { TopBar, type Tab } from './top-bar';

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  onHelp: () => void;
  /** 지금 보는 항목의 key (MAP_ENTRIES[].key) */
  entryKey: string;
  onEntry: (key: string) => void;
}

/** 한쪽 몸(앞 또는 뒤)을 그린다. 중심선(center)이 아닌 경로는 좌우 반전해서 한 번 더 그린다. */
function Body({ list, lv, focus, onPick }: { list: BodyPath[]; lv: Partial<Record<MuscleKey, Level>>; focus: MuscleKey | null; onPick: (k: MuscleKey) => void }) {
  const paths = list.flatMap((p, i) =>
    (p.center ? [1] : [1, -1]).map((sx) => ({ p, key: `${i}:${sx}`, mirror: sx < 0 })),
  );
  // 눌러서 강조한 근육은 맨 위에 그려야 테두리가 안 가려진다 → 마지막으로 보낸다
  paths.sort((a, b) => Number(a.p.muscle === focus && !!focus) - Number(b.p.muscle === focus && !!focus));
  return (
    <>
      {paths.map(({ p, key, mirror }) => {
        const level = p.muscle ? lv[p.muscle] : undefined;
        const cls = [p.cls, level === 3 ? 'on3' : '', p.muscle && p.muscle === focus ? 'hl' : ''].filter(Boolean).join(' ');
        return (
          <path
            key={key}
            d={p.d}
            className={cls}
            transform={mirror ? 'scale(-1 1)' : undefined}
            style={level ? { fill: `var(--l${level})` } : undefined}
            onClick={p.muscle ? () => onPick(p.muscle!) : undefined}
          />
        );
      })}
    </>
  );
}

export default function MuscleMapView({ tab, onTab, onHelp, entryKey, onEntry }: Props) {
  const index = Math.max(0, MAP_ENTRIES.findIndex((e) => e.key === entryKey));
  const entry = MAP_ENTRIES[index]!;
  const [focus, setFocus] = useState<MuscleKey | null>(null);

  const keys = useMemo(() => (Object.keys(entry.lv) as MuscleKey[]).sort((a, b) => entry.lv[b]! - entry.lv[a]!), [entry]);
  const go = (i: number) => {
    setFocus(null);
    onEntry(MAP_ENTRIES[(i + MAP_ENTRIES.length) % MAP_ENTRIES.length]!.key);
  };

  const hint = focus
    ? `${MUSCLE_NAMES[focus][0]} (${MUSCLE_NAMES[focus][1]})${entry.lv[focus] ? ` · ${LEVEL_LABEL[entry.lv[focus]!]}` : ' · 이 운동에선 거의 안 써요'}`
    : '근육을 누르면 이름이 나와요';

  return (
    <div className="wrap">
      <TopBar tab={tab} onTab={onTab} onHelp={onHelp}>
        <div className="pick">
          <button className="nav" type="button" aria-label="이전 운동" onClick={() => go(index - 1)}>
            ‹
          </button>
          <div className="sel">
            <select aria-label="운동 선택" value={entry.key} onChange={(e) => go(MAP_ENTRIES.findIndex((x) => x.key === e.target.value))}>
              {PARTS.map((part) => (
                <optgroup key={part} label={`${PART_LABEL[part]} 데이`}>
                  {MAP_ENTRIES.filter((e) => e.part === part).map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.isDay ? '▸ ' : ''}
                      {e.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button className="nav" type="button" aria-label="다음 운동" onClick={() => go(index + 1)}>
            ›
          </button>
        </div>
        <p className="day">
          {PART_LABEL[entry.part]} 데이 · {entry.scheme}
        </p>
      </TopBar>

      <div className="stage">
        <div className="fig">
          <svg viewBox="0 0 450 548" role="img" aria-label="인체 앞면과 뒷면 근육 지도">
            <g transform="translate(115 8)">
              <Body list={FRONT} lv={entry.lv} focus={focus} onPick={setFocus} />
            </g>
            <g transform="translate(335 8)">
              <Body list={BACK} lv={entry.lv} focus={focus} onPick={setFocus} />
            </g>
            <text className="cap" x="115" y="540" textAnchor="middle">
              앞면
            </text>
            <text className="cap" x="335" y="540" textAnchor="middle">
              뒷면
            </text>
          </svg>
          <div className="legend">
            <span><i style={{ background: 'var(--l3)' }} />주동근</span>
            <span><i style={{ background: 'var(--l2)' }} />보조근</span>
            <span><i style={{ background: 'var(--l1)' }} />안정화</span>
          </div>
          <p className="hint">{hint}</p>
        </div>

        <div className="info">
          <h2>쓰이는 근육</h2>
          <div className="rows">
            {keys.map((k) => {
              const l = entry.lv[k]!;
              return (
                <div
                  key={k}
                  className={`row${focus === k ? ' hl' : ''}`}
                  tabIndex={0}
                  onClick={() => setFocus(k)}
                  onMouseEnter={() => setFocus(k)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFocus(k);
                    }
                  }}
                >
                  <div>
                    <b>{MUSCLE_NAMES[k][0]}</b>
                    <small>
                      {MUSCLE_NAMES[k][1]} · {LEVEL_LABEL[l]}
                    </small>
                  </div>
                  <div className="meter" aria-label={LEVEL_LABEL[l]}>
                    {[1, 2, 3].map((j) => (
                      <i key={j} style={j <= l ? { background: `var(--l${l})` } : undefined} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <h2>{entry.isDay ? '이 날 루틴 요약' : '신경 쓸 점'}</h2>
          <ul className="tips">
            {entry.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="note">강도는 일반적인 근활성 기준의 대략적인 구분이고, 자세와 변형에 따라 달라져요. 그림은 운동에 쓰이는 근육 위주로 단순화한 근육도예요.</p>
        </div>
      </div>
    </div>
  );
}
