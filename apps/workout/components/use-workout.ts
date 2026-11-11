'use client';

/**
 * 진행 중인 운동 한 번의 상태와 동작을 모두 들고 있는 훅. 화면(logger.tsx)은 이 훅이 주는 값만 그린다.
 *
 * 저장 계층 (아래로 갈수록 느리지만 기기를 넘어간다)
 *  1) React 상태 — 조작 즉시 반영
 *  2) localStorage — 조작할 때마다 바로 씀. 새로고침·앱 재시작에도 이어진다.
 *     (iOS는 백그라운드 탭을 버릴 수 있어서 반드시 필요하다)
 *  3) 서버 임시 저장(workout_drafts) — 1.5초 디바운스. 다른 기기에서 이어하기 용도.
 *  4) 서버 본 저장(finishWorkout) — "저장"을 눌렀을 때만.
 * 시작할 때 localStorage와 서버 임시 저장 중 `ts`가 더 새로운 쪽을 따른다.
 *
 * 타이머는 "지금 - 시작 시각"으로 매번 계산한다. setInterval을 세는 방식이 아니라서
 * 화면이 꺼졌다 켜져도, 탭이 멈췄다 풀려도 시간이 틀어지지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { finishWorkout, saveDraft } from '@/app/(main)/actions';
import {
  buildPlan, canStart, firstStart, findSet, lastEnd, mmdd, newSet, parseTimeValue, recordText, runningSet, summarize,
  type Located, type PrevSets, type Session,
} from '@/lib/calc';
import { findExercise, PART_LABEL, shortName, type Part } from '@/lib/exercises';
import type { Overlays } from './use-overlays';

const LS_KEY = 'workout-session-v1';
const DRAFT_DEBOUNCE_MS = 1500;
/** 휴식 타이머가 삑 소리를 내는 시점 (초) — 권장 휴식 1:30~2:00의 시작 */
const BEEP_AT_SEC = 90;

export interface PrevInfo {
  prev: PrevSets;
  date: string | null;
}

export interface UseWorkoutArgs {
  /** 서버에 임시 저장돼 있던 진행 중 운동 (없으면 null) */
  serverDraft: Session | null;
  /** 구분별 지난 기록 (시작할 때 예정 세트를 채우는 용도) */
  prevByPart: Record<Part, PrevInfo>;
  ui: Pick<Overlays, 'ask' | 'toast'>;
}

const clone = <T,>(v: T): T => structuredClone(v);
const newId = (): string => Math.random().toString(36).slice(2, 9);

export function useWorkout({ serverDraft, prevByPart, ui }: UseWorkoutArgs) {
  const { ask, toast } = ui;
  const [S, setS] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ cls: '' | 'err'; text: string } | null>(null);

  const dirty = useRef(false); // 사용자가 조작한 뒤에만 서버에 임시 저장한다 (처음 로딩만으로는 쓰지 않는다)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Session | null>(null);
  const wake = useRef<WakeLockSentinel | null>(null);
  const actx = useRef<AudioContext | null>(null);
  const beeped = useRef<number | null>(null);

  /* ───── 시작할 때: 기기와 서버 임시 저장 중 최신 것을 고른다 ───── */
  useEffect(() => {
    let local: Session | null = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) local = JSON.parse(raw) as Session;
    } catch {
      local = null;
    }
    const pick = serverDraft && (!local || (serverDraft.ts ?? 0) > (local.ts ?? 0) + 1000) ? serverDraft : local;
    setS(pick);
    setNow(Date.now());
    setReady(true);
  }, [serverDraft]);

  /* ───── 상태가 바뀔 때마다 기기에 저장하고, 서버 임시 저장은 디바운스 ───── */
  useEffect(() => {
    latest.current = S;
    if (!ready) return;
    try {
      if (S) localStorage.setItem(LS_KEY, JSON.stringify(S));
      else localStorage.removeItem(LS_KEY);
    } catch {
      /* 저장 공간이 막혀도 화면은 계속 쓴다 */
    }
    if (!dirty.current || S?.saved) return; // 저장 완료된 운동은 임시 저장하지 않는다(본 저장이 지웠다)
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => void saveDraft(S), DRAFT_DEBOUNCE_MS);
  }, [S, ready]);

  /* 화면을 떠나거나 백그라운드로 가기 직전에 밀린 임시 저장을 바로 보낸다 */
  useEffect(() => {
    const flush = () => {
      if (!document.hidden || !draftTimer.current) return;
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
      if (dirty.current && !latest.current?.saved) void saveDraft(latest.current);
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, []);

  /* ───── 1초마다 현재 시각 갱신 (운동 중일 때만) ───── */
  const active = !!S && !S.saved;
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  /* ───── 화면 켜 두기(Wake Lock) ───── */
  const keepAwake = useCallback(() => {
    try {
      if (!wake.current && navigator.wakeLock) {
        navigator.wakeLock
          .request('screen')
          .then((w) => {
            wake.current = w;
            w.addEventListener('release', () => (wake.current = null));
          })
          .catch(() => {});
      }
    } catch {
      /* 지원하지 않는 브라우저 */
    }
  }, []);
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && latest.current && !latest.current.saved && firstStart(latest.current)) keepAwake();
      setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [keepAwake]);

  /* ───── 소리: iOS는 사용자가 누른 직후에만 오디오를 풀어 준다. 화면이 앞에 있을 때만 울린다 ───── */
  const unlockAudio = useCallback(() => {
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'ambient'; // 다른 앱 음악을 끊지 않게
      if (!actx.current) {
        const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (C) actx.current = new C();
      }
      if (actx.current?.state === 'suspended') void actx.current.resume();
    } catch {
      /* 소리 없이 계속 */
    }
  }, []);
  const beep = useCallback(() => {
    const ctx = actx.current;
    if (!ctx || document.hidden) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const t = ctx.currentTime;
      for (const d of [0, 0.25]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(0.4, t + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t + d);
        o.stop(t + d + 0.2);
      }
    } catch {
      /* 소리 없이 계속 */
    }
  }, []);

  /* 휴식이 1:30이 되는 순간(1:30~1:35 사이 한 번) 삑 */
  useEffect(() => {
    if (!S || S.saved || S.ended || !now || runningSet(S)) return;
    const le = lastEnd(S);
    if (!le) return;
    const r = (now - le) / 1000;
    if (r >= BEEP_AT_SEC && r < BEEP_AT_SEC + 5 && beeped.current !== le) {
      beeped.current = le;
      beep();
    }
  }, [now, S, beep]);

  /* ───── 상태 바꾸기: 복사본을 고쳐서 통째로 교체 ───── */
  const apply = useCallback((next: Session | null) => {
    dirty.current = true;
    setS(next ? { ...next, ts: Date.now() } : null);
  }, []);
  const mutate = useCallback(
    (fn: (n: Session) => void) => {
      if (!S) return;
      const n = clone(S);
      fn(n);
      apply(n);
    },
    [S, apply],
  );

  /* ───── 동작 ───── */

  /** 상체/하체를 골라 새 운동을 시작한다. 지난 기록은 서버가 미리 읽어 prevByPart로 줬다. */
  const startPart = useCallback(
    (part: Part) => {
      const info = prevByPart[part];
      const note = info.date ? `지난 ${PART_LABEL[part]} 기록(${mmdd(Date.parse(`${info.date}T12:00:00+09:00`))})에서 세트와 횟수를 불러왔어요.` : '지난 기록이 없어서 기본값(3세트)으로 채웠어요.';
      setSaveMsg(null);
      apply({ v: 1, id: `s_${Date.now()}`, part, items: buildPlan(part, info.prev, newId), ended: null, review: false, saved: false, memo: '', note, open: {} });
    },
    [prevByPart, apply],
  );

  const toggle = (i: number, currentOpen: boolean) => mutate((n) => (n.open[i] = !currentOpen));

  const addSet = (i: number) =>
    mutate((n) => {
      const it = n.items[i]!;
      const last = it.sets[it.sets.length - 1];
      it.sets.push(newSet(last ? last.reps : (findExercise(it.n)?.defaultReps ?? 10), true, newId()));
      n.open[i] = true;
    });

  /** + : 세트 시작. 순서 잠금(canStart)을 한 번 더 확인한다. */
  const begin = (id: string) => {
    if (!S) return;
    unlockAudio();
    const o = findSet(S, id);
    if (!o || !canStart(S, o.i, o.j)) return;
    keepAwake();
    mutate((n) => {
      const x = findSet(n, id)!;
      x.s.st = 'run';
      x.s.start = Date.now();
      x.s.end = null;
      n.open[x.i] = true;
      if (x.j === 0) for (let k = 0; k < x.i; k++) n.open[k] = false; // 새 종목을 시작하면 앞 종목 카드는 접는다
    });
  };

  /** ✓ : 세트 끝. 끝 시각을 지금으로, 시작보다 앞서지 않게 */
  const check = (id: string) => {
    unlockAudio();
    mutate((n) => finishRun(findSet(n, id), Date.now()));
  };

  const cancelRun = (id: string) => {
    mutate((n) => {
      const x = findSet(n, id);
      if (!x) return;
      x.s.st = 'plan';
      x.s.start = null;
      x.s.end = null;
    });
    toast('시작을 취소했어요.');
  };

  /** 하는 중인 세트의 시작 시각을 앞으로 당긴다 (+ 누르는 걸 깜빡했을 때) */
  const shiftStart = (id: string, deltaSec: number) =>
    mutate((n) => {
      const x = findSet(n, id);
      if (x?.s.start) x.s.start = Math.min(Date.now(), x.s.start + deltaSec * 1000);
    });

  const skipItem = (i: number) => {
    if (!S) return;
    const it = S.items[i]!;
    const removed = it.sets.filter((s) => s.st === 'plan').length;
    ask('이 운동을 건너뛸까요?', `${it.n}의 남은 예정 세트 ${removed}개를 치우고 다음 운동을 열어요.`, '건너뛰기', () => {
      const keep = clone(it.sets);
      mutate((n) => {
        n.items[i]!.sets = n.items[i]!.sets.filter((s) => s.st !== 'plan');
        n.open[i] = false;
      });
      toast(`${shortName(it.n)}을(를) 건너뛰었어요.`, '되돌리기', () => mutate((n) => (n.items[i]!.sets = keep)));
    });
  };

  const unlockSet = (id: string) => {
    if (!S) return;
    const o = findSet(S, id);
    if (!o) return;
    ask('이 세트를 고칠까요?', `${shortName(o.it.n)} ${o.j + 1}세트의 횟수와 시각을 다시 고칠 수 있게 열어요. 고친 세트는 '고침'으로 표시돼요.`, '고치기', () =>
      mutate((n) => {
        const x = findSet(n, id);
        if (x) {
          x.s.unlocked = true;
          x.s.edited = true;
        }
      }),
    );
  };
  const relock = (id: string) =>
    mutate((n) => {
      const x = findSet(n, id);
      if (x) x.s.unlocked = false;
    });

  const deleteSet = (id: string) => {
    if (!S) return;
    const o = findSet(S, id);
    if (!o) return;
    ask('세트를 지울까요?', `${shortName(o.it.n)} ${o.j + 1}세트를 지워요.${o.s.start ? ' 기록된 시각도 함께 지워져요.' : ''}`, '지우기', () => {
      const removed = clone(o.s);
      const at = o.j;
      const ii = o.i;
      mutate((n) => {
        const x = findSet(n, id);
        if (x) x.it.sets.splice(x.j, 1);
      });
      toast(`${shortName(o.it.n)} 세트를 지웠어요.`, '되돌리기', () => mutate((n) => n.items[ii]!.sets.splice(Math.min(at, n.items[ii]!.sets.length), 0, removed)));
    }, true);
  };

  const setReps = (id: string, reps: number) =>
    mutate((n) => {
      const x = findSet(n, id);
      if (!x) return;
      x.s.reps = Math.max(0, Math.round(reps));
      if (x.s.st === 'done') x.s.edited = true;
    });

  /** 시작/끝 시각을 손으로 고친다. 이상한 값이면 토스트로 알리고 false를 돌려 입력칸이 원래 값으로 돌아가게 한다. */
  const setTime = (id: string, which: 'start' | 'end', value: string): boolean => {
    if (!S) return false;
    const o = findSet(S, id);
    if (!o) return false;
    const ref = (which === 'start' ? o.s.start : o.s.end) ?? Date.now();
    const t = parseTimeValue(value, ref);
    if (t === null) return false;
    const fail = (msg: string) => {
      toast(msg);
      return false;
    };
    if (which === 'start') {
      if (t > Date.now()) return fail('시작 시각은 지금보다 늦을 수 없어요.');
      if (o.s.end && t >= o.s.end) return fail('시작이 끝보다 늦을 수 없어요.');
    } else {
      if (o.s.start && t <= o.s.start) return fail('끝이 시작보다 빠를 수 없어요.');
      if (t > Date.now()) return fail('끝 시각은 지금보다 늦을 수 없어요.');
    }
    mutate((n) => {
      const x = findSet(n, id)!;
      if (which === 'start') x.s.start = t;
      else x.s.end = t;
      if (x.s.st === 'done') x.s.edited = true;
    });
    return true;
  };

  /** 운동 완료 → (확인) → 검토 화면. 하는 중인 세트는 지금 시각으로 끝낸다. */
  const finish = () => {
    if (!S) return;
    const run = runningSet(S);
    ask('운동을 끝낼까요?', `${run ? `진행 중인 ${shortName(run.it.n)} ${run.j + 1}세트는 지금 시각으로 끝나요. ` : ''}다음 화면에서 확인한 뒤 저장해요. 돌아가기로 되돌릴 수 있어요.`, '운동 완료', () => {
      const n = clone(S);
      const t = Date.now();
      finishRun(runningSet(n), t);
      if (!summarize(n, t).sets.length) {
        ask('끝낸 세트가 없어요', '저장할 기록이 없어요. 이번 기록을 버리고 처음 화면으로 갈까요?', '버리기', () => apply(null), true);
        return;
      }
      n.ended = t;
      n.review = true;
      setSaveMsg(null);
      apply(n);
      window.scrollTo(0, 0);
    });
  };

  const backToLog = () => {
    setSaveMsg(null);
    mutate((n) => {
      n.review = false;
      n.ended = null;
    });
  };

  /** 검토 화면의 "고치기": 로그 화면으로 돌아가 그 세트를 열어 준다 */
  const fixSet = (id: string) => {
    mutate((n) => {
      n.review = false;
      n.ended = null;
      const x = findSet(n, id);
      if (x) {
        x.s.unlocked = true;
        x.s.edited = true;
        n.open[x.i] = true;
      }
    });
    setTimeout(() => {
      const el = document.getElementById(`s-${id}`);
      el?.scrollIntoView({ block: 'center' });
      el?.focus();
    }, 50);
  };

  const setMemo = (memo: string) => mutate((n) => (n.memo = memo));

  /** 저장: 서버에 본 저장. 같은 세션 id로 다시 눌러도 겹치지 않는다. */
  const save = async () => {
    if (!S || saving) return;
    const sm = summarize(S, Date.now());
    setSaving(true);
    setSaveMsg({ cls: '', text: '저장하는 중…' });
    try {
      const res = await finishWorkout({
        id: S.id,
        part: S.part,
        startedAt: sm.start,
        endedAt: sm.end,
        finished: sm.full,
        memo: S.memo,
        sets: sm.sets.map((x) => ({ exercise: x.ex, ord: x.order, setNo: x.no, reps: x.reps, unit: x.unit, startedAt: x.start, endedAt: x.end, extra: x.extra, edited: x.edited })),
      });
      if (res.ok) {
        setSaveMsg(null);
        mutate((n) => (n.saved = true));
      } else setSaveMsg({ cls: 'err', text: `${res.error} 다시 눌러도 겹치지 않아요.` });
    } catch {
      setSaveMsg({ cls: 'err', text: '네트워크가 불안정해요. 잠시 뒤 다시 눌러 주세요. 기록은 이 기기에 그대로 남아 있어요.' });
    }
    setSaving(false);
  };

  /** 저장이 안 될 때 Claude에게 붙여 넣을 글을 클립보드에 복사 */
  const copyRecord = async (onFallback: (text: string) => void) => {
    if (!S) return;
    const text = recordText(S, Date.now());
    try {
      await navigator.clipboard.writeText(text);
      toast('기록을 복사했어요. Claude에게 붙여 주세요.');
    } catch {
      onFallback(text);
      toast('자동 복사가 막혀서 아래에 펼쳤어요. 길게 눌러 복사해 주세요.');
    }
  };

  const discard = () => ask('이번 기록을 버릴까요?', '지금까지 기록한 세트와 시간이 모두 지워지고 되돌릴 수 없어요.', '버리기', () => apply(null), true);
  const startOver = () => {
    setSaveMsg(null);
    apply(null);
  };

  return {
    S, ready, now, saving, saveMsg,
    startPart, toggle, addSet, begin, check, cancelRun, shiftStart, skipItem, unlockSet, relock, deleteSet,
    setReps, setTime, finish, backToLog, fixSet, setMemo, save, copyRecord, discard, startOver,
  };
}

/** 하는 중인 세트를 끝낸다 (끝 시각은 시작보다 앞서지 않게) */
function finishRun(o: Located | undefined, t: number): void {
  if (!o || !o.s.start) return;
  o.s.end = Math.max(t, o.s.start);
  o.s.st = 'done';
  o.s.unlocked = false;
}
