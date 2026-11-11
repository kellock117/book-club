'use client';

/**
 * 운동 기록 화면. 상태와 동작은 use-workout 훅이 갖고, 이 파일은 그리기만 한다.
 *
 * 화면은 네 가지 중 하나다.
 *  1) 시작 전(S 없음)     — 상체/하체 고르기
 *  2) 진행 중             — 종목 카드 + 세트 줄. 세트마다 + 로 시작, ✓ 로 끝. 그 사이 시간이 휴식으로 계산된다.
 *  3) 검토(S.review)      — 합계·확인해 볼 값·메모 → 저장
 *  4) 저장 완료(S.saved)  — 새 운동 시작
 */
import { useEffect, useRef, useState } from 'react';
import { canStart, currentItemIndex, dur, firstStart, flagsOf, hm, hms, lastEnd, restOf, runningSet, summarize, timeValue, type Item, type Session, type SetRec } from '@/lib/calc';
import { exercisesOf, findExercise, PART_LABEL, PARTS, shortName } from '@/lib/exercises';
import { IconCheck, IconChevron, IconLock, IconPlus, IconTrash, IconUndo } from './icons';
import { TopBar, type Tab } from './top-bar';
import type { useWorkout } from './use-workout';

type W = ReturnType<typeof useWorkout>;

interface Props {
  w: W;
  tab: Tab;
  onTab: (t: Tab) => void;
  onHelp: () => void;
  /** 카드 제목을 눌렀을 때: 그 종목의 근육 지도를 연다 */
  onMap: (exerciseName: string) => void;
}

/* ───────────── 입력 조각 ───────────── */

/** 횟수 입력. 누르면 비워서 이전 값이 흐리게 보이고, 비운 채로 벗어나면 원래 값으로 돌아간다. */
function RepsInput({ id, reps, unit, label, onCommit }: { id: string; reps: number; unit: string; label: string; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(reps));
  const [focused, setFocused] = useState(false);
  useEffect(() => setText(String(reps)), [reps]);
  return (
    <label className="reps">
      <input
        id={`r-${id}`}
        type="number"
        inputMode="numeric"
        min={0}
        aria-label={label}
        value={focused ? text : String(reps)}
        placeholder={String(reps)}
        onFocus={() => {
          setFocused(true);
          setText('');
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          setFocused(false);
          if (text !== '' && Number(text) !== reps) onCommit(Number(text) || 0);
          else setText(String(reps));
        }}
      />
      {unit}
    </label>
  );
}

/** 시각 입력(초 단위). 입력을 마치고 벗어날 때 확정하고, 이상한 값이면 원래 값으로 되돌린다. */
function TimeInput({ id, value, label, onCommit }: { id: string; value: number; label?: string; onCommit: (v: string) => boolean }) {
  const [text, setText] = useState(timeValue(value));
  useEffect(() => setText(timeValue(value)), [value]);
  return (
    <input
      type="time"
      step={1}
      id={id}
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== timeValue(value) && !onCommit(text)) setText(timeValue(value));
      }}
    />
  );
}

/* ───────────── 세트 한 줄 ───────────── */

function SetRow({ S, it, i, s, j, now, w }: { S: Session; it: Item; i: number; s: SetRec; j: number; now: number; w: W }) {
  const no = j + 1;
  const r = restOf(S, s);
  const restTxt = r !== null && <span className={r < 0 || r > 1800 ? 'w' : ''}>휴식 {dur(r * 1000)}</span>;
  const repsLabel = `${no}세트 ${it.unit === '초' ? '초' : '횟수'}`;
  const del = (
    <button type="button" className="ib del" aria-label={`${no}세트 삭제`} onClick={() => w.deleteSet(s.id)}>
      <IconTrash />
    </button>
  );

  if (s.st === 'plan')
    return (
      <div className="set plan">
        <span className="no">{no}</span>
        <RepsInput id={s.id} reps={s.reps} unit={it.unit} label={repsLabel} onCommit={(v) => w.setReps(s.id, v)} />
        <span className="tm">예정{s.extra ? ' · 추가 세트' : ''}</span>
        <div className="acts">
          <button type="button" className="ib go" aria-label={`${no}세트 시작`} disabled={!canStart(S, i, j)} onClick={() => w.begin(s.id)}>
            <IconPlus />
          </button>
          {del}
        </div>
      </div>
    );

  if (s.st === 'run')
    return (
      <div className="set run">
        <span className="no">{no}</span>
        <RepsInput id={s.id} reps={s.reps} unit={it.unit} label={repsLabel} onCommit={(v) => w.setReps(s.id, v)} />
        <div className="tm">
          <span className="live">{dur(now - s.start!)}</span>
          <label>
            시작 <TimeInput id={`s-${s.id}`} value={s.start!} onCommit={(v) => w.setTime(s.id, 'start', v)} />
          </label>
          <button type="button" className="chip" onClick={() => w.shiftStart(s.id, -10)}>
            −10초
          </button>
          <button type="button" className="chip" onClick={() => w.shiftStart(s.id, -60)}>
            −1분
          </button>
          {restTxt}
        </div>
        <div className="acts">
          <button type="button" className="ib" aria-label="시작 취소" onClick={() => w.cancelRun(s.id)}>
            <IconUndo />
          </button>
          <button type="button" className="ib chk" aria-label={`${no}세트 끝`} onClick={() => w.check(s.id)}>
            <IconCheck />
          </button>
        </div>
      </div>
    );

  const work = Math.round((s.end! - s.start!) / 1000);
  if (s.unlocked)
    return (
      <div className="set done">
        <span className="no">{no}</span>
        <RepsInput id={s.id} reps={s.reps} unit={it.unit} label={repsLabel} onCommit={(v) => w.setReps(s.id, v)} />
        <div className="tm">
          <TimeInput id={`s-${s.id}`} value={s.start!} label="시작 시각" onCommit={(v) => w.setTime(s.id, 'start', v)} />→
          <TimeInput id={`e-${s.id}`} value={s.end!} label="끝 시각" onCommit={(v) => w.setTime(s.id, 'end', v)} />
          <span>운동 {dur(work * 1000)}</span>
          {restTxt}
        </div>
        <div className="acts">
          <button type="button" className="ib chk" aria-label="고치기 끝내고 잠그기" onClick={() => w.relock(s.id)}>
            <IconCheck />
          </button>
          {del}
        </div>
      </div>
    );

  return (
    <div className="set done">
      <span className="no">{no}</span>
      <span className="reps">
        <b>{s.reps}</b>
        {it.unit}
      </span>
      <div className="tm">
        <span>
          {hms(s.start!)} → {hms(s.end!)}
        </span>
        <span className={work > 600 ? 'w' : ''}>운동 {dur(work * 1000)}</span>
        {restTxt}
        {s.edited && <span>고침</span>}
      </div>
      <div className="acts">
        <button type="button" className="ib lock" aria-label={`${no}세트 고치기`} onClick={() => w.unlockSet(s.id)}>
          <IconLock />
        </button>
        {del}
      </div>
    </div>
  );
}

/* ───────────── 종목 카드 ───────────── */

function ExerciseCard({ S, it, i, cur, now, w, onMap }: { S: Session; it: Item; i: number; cur: boolean; now: number; w: W; onMap: Props['onMap'] }) {
  const done = it.sets.filter((s) => s.st === 'done');
  const open = S.open[i] !== undefined ? S.open[i]! : cur;
  const span = done.length ? ` · ${dur(Math.max(...done.map((s) => s.end!)) - Math.min(...done.map((s) => s.start!)))}` : '';
  return (
    <section className={`card${cur ? ' cur' : ''}`}>
      <header>
        <button type="button" className="ctitle" aria-label={`${it.n} 근육 지도 보기`} onClick={() => onMap(it.n)}>
          <b>{it.n}</b>
          <small>
            {done.length}/{it.sets.length}세트{span}
          </small>
        </button>
        <span className="pbadge">{findExercise(it.n)?.area}</span>
        <button type="button" className="chev" aria-expanded={open} aria-label={`${it.n}${open ? ' 접기' : ' 펼치기'}`} onClick={() => w.toggle(i, open)}>
          <IconChevron />
        </button>
      </header>
      {open && (
        <>
          <div className="sets">
            {it.sets.map((s, j) => (
              <SetRow key={s.id} S={S} it={it} i={i} s={s} j={j} now={now} w={w} />
            ))}
          </div>
          <div className="addrow">
            <button type="button" className="addset" onClick={() => w.addSet(i)}>
              + 세트 추가
            </button>
            {it.sets.some((s) => s.st === 'plan') && (
              <button type="button" className="skip" onClick={() => w.skipItem(i)}>
                이 운동 건너뛰기
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ───────────── 상단: 진행 상황 줄 ───────────── */

function StatLine({ S, now }: { S: Session; now: number }) {
  const run = runningSet(S);
  const le = lastEnd(S);
  if (run) {
    return (
      <span className="stat run">
        운동 중 <b>{dur(now - run.s.start!)}</b> · {shortName(run.it.n)} {run.j + 1}세트
      </span>
    );
  }
  if (le) {
    const r = (now - le) / 1000;
    return (
      <span className={`stat${r >= 120 ? ' over' : r >= 90 ? ' ok' : ''}`}>
        휴식 <b>{dur(r * 1000)}</b> · 권장 1:30~2:00
      </span>
    );
  }
  return <span className="stat">첫 세트의 + 를 누르면 시간이 재져요.</span>;
}

/* ───────────── 화면 본체 ───────────── */

export default function Logger({ w, tab, onTab, onHelp, onMap }: Props) {
  const { S, now } = w;
  const [copyText, setCopyText] = useState<string | null>(null);
  const copyRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => copyRef.current?.select(), [copyText]);

  // 1) 시작 전
  if (!S) {
    return (
      <div className="wrap">
        <TopBar tab={tab} onTab={onTab} onHelp={onHelp} />
        <div className="log">
          <p className="lead">오늘 할 운동을 고르면 지난 기록에서 세트와 횟수를 불러와요.</p>
          <div className="parts">
            {PARTS.map((p) => (
              <button key={p} type="button" className="part" onClick={() => w.startPart(p)}>
                <b>{PART_LABEL[p]} 데이</b>
                <small>{exercisesOf(p).map((e) => shortName(e.name)).join(' · ')}</small>
              </button>
            ))}
          </div>
          <p className="small">세트마다 + 로 시작하고 ✓ 로 끝내요. 그 사이 시간이 휴식으로 계산돼요.</p>
        </div>
      </div>
    );
  }

  // 4) 저장 완료
  if (S.saved) {
    const sm = summarize(S, now);
    return (
      <div className="wrap">
        <TopBar tab={tab} onTab={onTab} onHelp={onHelp} />
        <div className="log">
          <div className="msg ok">
            저장했어요. {sm.title} · 총 {dur(sm.total * 1000)} · {sm.sets.length}세트
          </div>
          <button type="button" className="btn big pri" onClick={w.startOver}>
            새 운동 시작
          </button>
        </div>
      </div>
    );
  }

  // 3) 검토
  if (S.review) {
    const sm = summarize(S, now);
    const flags = flagsOf(sm);
    return (
      <div className="wrap">
        <TopBar tab={tab} onTab={onTab} onHelp={onHelp} />
        <div className="log">
          <div className="head">
            <div className="h1">
              <b>{sm.title} 검토</b>
              <span className="tot">
                {hm(sm.start)} → {hm(sm.end)}
              </span>
            </div>
            <span className="small">{sm.full ? '계획한 세트를 모두 했어요.' : '중간에 끝낸 운동으로 저장돼요. 시작하지 않은 세트는 저장되지 않아요.'}</span>
          </div>
          <div className="grid4">
            {[
              ['총 시간', dur(sm.total * 1000)],
              ['운동 시간 합', dur(sm.work * 1000)],
              ['휴식 합', dur(sm.rest * 1000)],
              ['세트', String(sm.sets.length)],
            ].map(([k, v]) => (
              <div key={k} className="tile">
                <small>{k}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
          {flags.length > 0 && (
            <div className="flag">
              <b>확인해 볼 값</b>
              {flags.map((f) => (
                <div key={`${f.set.id}-${f.text}`}>
                  <span>
                    {shortName(f.set.ex)} {f.set.no}세트 · {f.text}
                  </span>
                  <button type="button" className="chip" onClick={() => w.fixSet(f.set.id)}>
                    고치기
                  </button>
                </div>
              ))}
            </div>
          )}
          <table className="tbl">
            <tbody>
              {sm.perEx.map((p) => (
                <tr key={p.n}>
                  <td>
                    {p.n}
                    <br />
                    <span className="small">
                      {p.reps.join(' · ')}
                      {p.unit}
                    </span>
                  </td>
                  <td>{dur(p.span)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <label className="small" htmlFor="memo">
            메모 (선택)
          </label>
          <textarea id="memo" placeholder="컨디션, 바꾼 변형 등" value={S.memo} onChange={(e) => w.setMemo(e.target.value)} />
          {w.saveMsg && (
            <p className={`msg ${w.saveMsg.cls}`} role="status">
              {w.saveMsg.text}
            </p>
          )}
          <div className="row2">
            <button type="button" className="btn" disabled={w.saving} onClick={w.backToLog}>
              돌아가기
            </button>
            <button type="button" className="btn pri" disabled={w.saving} onClick={w.save}>
              저장
            </button>
          </div>
          <button type="button" className="link" onClick={() => w.copyRecord(setCopyText)}>
            기록 복사 (저장이 안 될 때 Claude에게 붙여 주세요)
          </button>
          {copyText && <textarea ref={copyRef} readOnly value={copyText} style={{ minHeight: 160 }} />}
        </div>
      </div>
    );
  }

  // 2) 진행 중
  const ci = currentItemIndex(S);
  const fs = firstStart(S);
  return (
    <div className="wrap">
      <TopBar tab={tab} onTab={onTab} onHelp={onHelp}>
        <div className="logbar">
          <div className="lb1">
            <span>
              <b>{PART_LABEL[S.part]} 데이</b>
            </span>
            <span>{fs ? `시작 ${hm(fs)} · 총 ${dur(now - fs)}` : '아직 시작 전'}</span>
          </div>
          <StatLine S={S} now={now} />
        </div>
      </TopBar>
      <div className="log">
        {S.note && <p className="small">{S.note}</p>}
        {S.items.map((it, i) => (
          <ExerciseCard key={it.n} S={S} it={it} i={i} cur={i === ci} now={now} w={w} onMap={onMap} />
        ))}
        <button type="button" className="btn big pri" onClick={w.finish}>
          운동 완료
        </button>
        <button type="button" className="link" onClick={w.discard}>
          이번 기록 버리기
        </button>
      </div>
    </div>
  );
}
