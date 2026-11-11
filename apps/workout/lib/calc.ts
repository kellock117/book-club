/**
 * 운동 기록의 "계산" 전부. 화면·DB를 모르는 순수 함수라서 테스트로 고정해 둔다 (calc.test.ts).
 *
 * 용어
 * - 세션(Session): 운동 한 번. 종목(Item) 여러 개, 종목마다 세트(SetRec) 여러 개.
 * - 세트 상태 st: 'plan' 예정 → 'run' 하는 중(+ 누름) → 'done' 끝(✓ 누름)
 * - 휴식 = 이전 세트가 끝난 시각 ~ 이번 세트를 시작한 시각. 저장하지 않고 항상 계산한다.
 *
 * 시각은 모두 epoch ms(숫자). 날짜·시각 표시는 서울(UTC+9) 고정이라, 폰의 시간대가 달라도 같은 값이 나온다.
 * 서울은 서머타임이 없어서 +9시간을 더하는 것만으로 충분하다.
 */
import { exercisesOf, findExercise, PART_LABEL, shortName, type Part, type Unit } from './exercises';

/* ───────────── 타입 ───────────── */

export type SetStatus = 'plan' | 'run' | 'done';

export interface SetRec {
  id: string;
  reps: number;
  st: SetStatus;
  start: number | null;
  end: number | null;
  /** 계획에 없던 "+ 세트 추가"로 만든 세트 */
  extra: boolean;
  /** 끝난 뒤 횟수·시각을 손으로 고친 세트 */
  edited: boolean;
  /** 고치기 위해 잠금을 푼 상태 (저장 대상 아님, 화면 전용) */
  unlocked: boolean;
}

export interface Item {
  n: string;
  unit: Unit;
  sets: SetRec[];
}

export interface Session {
  v: 1;
  /** s_<시작 시각 ms> 같은 문자열. 같은 id로 다시 저장하면 덮어쓴다 */
  id: string;
  part: Part;
  items: Item[];
  /** 검토 화면으로 넘어간 시각(= 운동 종료 시각). 아직이면 null */
  ended: number | null;
  review: boolean;
  /** 저장 완료 */
  saved: boolean;
  memo: string;
  /** 시작 화면의 안내 문구 ("지난 하체 기록에서 …") */
  note: string;
  /** 카드 펼침 상태 (종목 인덱스 → 펼침). 없으면 지금 하는 종목만 펼친다 */
  open: Record<number, boolean>;
  /** 마지막으로 바뀐 시각 (기기·서버 임시 저장 중 어느 쪽이 최신인지 가리는 용도) */
  ts?: number;
}

/* ───────────── 날짜·시각 (서울 고정) ───────────── */

const HOUR = 3_600_000;
const SEOUL = 9 * HOUR;
/** 이 시각 전에 시작한 운동은 전날 운동으로 센다 (수면 기준일과 같은 규칙) */
export const DAY_START_HOUR = 5;

const p2 = (n: number): string => (n < 10 ? '0' : '') + n;

/** 서울 시각의 "벽시계" 값으로 바꿔서 UTC 필드로 읽는다 */
const wall = (t: number): Date => new Date(t + SEOUL);

/** 운동한 날짜(YYYY-MM-DD). 새벽 5시 전 시작은 전날. */
export const workoutDate = (t: number): string => new Date(t + SEOUL - DAY_START_HOUR * HOUR).toISOString().slice(0, 10);

/** '11/09' 형식 (운동한 날 기준) */
export const mmdd = (t: number): string => workoutDate(t).slice(5).replace('-', '/');

/** 요일 한 글자 (운동한 날 기준) */
export const weekday = (t: number): string => '일월화수목금토'[new Date(t + SEOUL - DAY_START_HOUR * HOUR).getUTCDay()] ?? '';

/** 14:05 */
export const hm = (t: number): string => {
  const d = wall(t);
  return `${d.getUTCHours()}:${p2(d.getUTCMinutes())}`;
};

/** 14:05:09 */
export const hms = (t: number): string => `${hm(t)}:${p2(wall(t).getUTCSeconds())}`;

/** <input type="time" step=1>에 넣는 값: 14:05:09 (시가 두 자리) */
export const timeValue = (t: number): string => {
  const d = wall(t);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;
};

/** 걸린 시간 표시: 90000 → '1:30', 3725000 → '1:02:05'. 음수는 앞에 −. */
export function dur(ms: number): string {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${neg ? '−' : ''}${h ? `${h}:${p2(m)}` : m}:${p2(s % 60)}`;
}

/**
 * 시각 입력("14:05:09")을 epoch ms로 되돌린다. 날짜는 기준 시각(ref) 근처로 고른다:
 * 자정을 넘겨 입력한 값이 하루 어긋나지 않게 ref에서 ±12시간 안으로 맞춘다.
 * 형식이 틀리면 null.
 */
export function parseTimeValue(v: string, ref: number): number | null {
  const a = String(v || '').split(':');
  if (a.length < 2) return null;
  const [h, m, s] = [Number(a[0]), Number(a[1]), Number(a[2] ?? 0)];
  if ([h, m, s].some((x) => !Number.isFinite(x))) return null;
  const dayStart = Math.floor((ref + SEOUL) / (24 * HOUR)) * 24 * HOUR - SEOUL;
  let t = dayStart + h * HOUR + m * 60_000 + s * 1000;
  if (t - ref > 12 * HOUR) t -= 24 * HOUR;
  if (ref - t > 12 * HOUR) t += 24 * HOUR;
  return t;
}

/* ───────────── 세션 조회 ───────────── */

export interface Located {
  it: Item;
  i: number;
  s: SetRec;
  j: number;
}

/** 모든 세트를 위치(종목 인덱스 i, 세트 인덱스 j)와 함께 평탄하게 */
export function allSets(S: Session): Located[] {
  return S.items.flatMap((it, i) => it.sets.map((s, j) => ({ it, i, s, j })));
}

export const findSet = (S: Session, id: string): Located | undefined => allSets(S).find((o) => o.s.id === id);

/** 지금 하는 중(+ 누른)인 세트 */
export const runningSet = (S: Session): Located | undefined => allSets(S).find((o) => o.s.st === 'run');

/** 가장 먼저 시작한 시각 */
export function firstStart(S: Session): number | null {
  const ts = allSets(S).flatMap((o) => (o.s.start ? [o.s.start] : []));
  return ts.length ? Math.min(...ts) : null;
}

/** 가장 마지막에 끝난 시각 (휴식 타이머의 기준) */
export function lastEnd(S: Session): number | null {
  const ts = allSets(S).flatMap((o) => (o.s.end ? [o.s.end] : []));
  return ts.length ? Math.max(...ts) : null;
}

/** 이 세트 앞의 휴식(초). 앞에 끝난 세트가 없거나 아직 시작 전이면 null. 겹치면 음수가 나온다. */
export function restOf(S: Session, s: SetRec): number | null {
  if (!s.start) return null;
  let prevEnd: number | null = null;
  for (const { s: t } of allSets(S)) {
    if (t !== s && t.end && t.start && t.start < s.start && (prevEnd === null || t.end > prevEnd)) prevEnd = t.end;
  }
  return prevEnd === null ? null : Math.round((s.start - prevEnd) / 1000);
}

/** 지금 해야 하는 종목의 인덱스. 하는 중인 세트가 있으면 그 종목, 없으면 예정 세트가 남은 첫 종목. 없으면 -1. */
export function currentItemIndex(S: Session): number {
  const r = runningSet(S);
  if (r) return r.i;
  return S.items.findIndex((it) => it.sets.some((s) => s.st === 'plan'));
}

/**
 * 이 세트의 + 를 누를 수 있는가. 순서를 지키게 한다:
 * 하는 중인 세트가 없고, 앞 종목의 세트가 모두 끝났고(건너뛰기로 치운 것 포함), 같은 종목의 앞 세트가 모두 끝났을 때만.
 */
export function canStart(S: Session, i: number, j: number): boolean {
  if (runningSet(S)) return false;
  for (let k = 0; k < i; k++) if (S.items[k]?.sets.some((s) => s.st !== 'done')) return false;
  for (let m = 0; m < j; m++) if (S.items[i]?.sets[m]?.st !== 'done') return false;
  return true;
}

/* ───────────── 요약 ───────────── */

export interface SummarySet {
  id: string;
  ex: string;
  /** 종목 순서 (1부터) */
  order: number;
  /** 그 종목 안에서 끝난 세트의 번호 (1부터, 건너뛴 세트를 빼고 다시 센 값) */
  no: number;
  reps: number;
  unit: Unit;
  start: number;
  end: number;
  /** 운동 시간(초) */
  work: number;
  /** 앞 휴식(초), 없으면 null */
  rest: number | null;
  extra: boolean;
  edited: boolean;
}

export interface Summary {
  sets: SummarySet[];
  perEx: { n: string; unit: Unit; span: number; reps: number[] }[];
  /** 운동 시간 합(초) */
  work: number;
  /** 휴식 합(초). 음수(겹침)는 더하지 않는다 */
  rest: number;
  start: number;
  end: number;
  /** 총 시간(초) */
  total: number;
  /** '11/09 (일) 하체' */
  title: string;
  /** 계획한 세트를 전부 끝냈는가 (추가 세트는 계획에 안 들어간다) */
  full: boolean;
}

/** 끝난(done) 세트만 모아 합계를 낸다. `now`는 아직 안 끝난 운동의 종료 시각 기준. */
export function summarize(S: Session, now: number): Summary {
  const sets: SummarySet[] = [];
  const perEx: Summary['perEx'] = [];
  let work = 0;
  let rest = 0;

  S.items.forEach((it, i) => {
    const done = it.sets.filter((s) => s.st === 'done' && s.start !== null && s.end !== null).sort((a, b) => a.start! - b.start!);
    if (!done.length) return;
    const lo = done[0]!.start!;
    const hi = Math.max(...done.map((s) => s.end!));
    perEx.push({ n: it.n, unit: it.unit, span: hi - lo, reps: done.map((s) => s.reps) });
    done.forEach((s, k) => {
      const w = Math.round((s.end! - s.start!) / 1000);
      const r = restOf(S, s);
      work += w;
      if (r !== null && r > 0) rest += r;
      sets.push({ id: s.id, ex: it.n, order: i + 1, no: k + 1, reps: Number(s.reps) || 0, unit: it.unit, start: s.start!, end: s.end!, work: w, rest: r, extra: s.extra, edited: s.edited });
    });
  });

  const start = firstStart(S) ?? now;
  const end = S.ended ?? now;
  const full = S.items.every((it) => it.sets.every((s) => s.st === 'done' || s.extra));
  return { sets, perEx, work, rest, start, end, total: Math.round((end - start) / 1000), title: `${mmdd(start)} (${weekday(start)}) ${PART_LABEL[S.part]}`, full };
}

/** 검토 화면에서 "확인해 볼 값": 휴식이 30분을 넘거나 음수, 세트 하나가 10분을 넘는 것 */
export function flagsOf(sm: Summary): { set: SummarySet; text: string }[] {
  const out: { set: SummarySet; text: string }[] = [];
  for (const x of sm.sets) {
    if (x.rest !== null && (x.rest < 0 || x.rest > 1800)) out.push({ set: x, text: `휴식 ${dur(x.rest * 1000)}` });
    if (x.work > 600) out.push({ set: x, text: `운동 ${dur(x.work * 1000)}` });
  }
  return out;
}

/* ───────────── 시작할 때 계획 만들기 ───────────── */

/** 지난 기록의 한 세트: 세트 번호와 횟수 */
export type PrevSets = Record<string, { n: number; r: number }[]>;

/**
 * 같은 구분의 지난 기록에서 세트 수·횟수를 가져와 예정 세트를 만든다.
 * 지난 기록에 없는 종목은 기본 횟수로 3세트.
 * @param newId 세트 id 생성기 (테스트에서 고정값을 넣으려고 주입)
 */
export function buildPlan(part: Part, prev: PrevSets, newId: () => string): Item[] {
  return exercisesOf(part).map((e) => {
    const p = prev[e.name];
    const reps = p?.length ? p.map((x) => x.r || e.defaultReps) : [e.defaultReps, e.defaultReps, e.defaultReps];
    return { n: e.name, unit: e.unit, sets: reps.map((r) => newSet(r, false, newId())) };
  });
}

export function newSet(reps: number, extra: boolean, id: string): SetRec {
  return { id, reps, st: 'plan', start: null, end: null, extra, edited: false, unlocked: false };
}

/* ───────────── 기록 복사용 글 ───────────── */

/** 저장이 안 될 때 Claude에게 붙여 넣는 텍스트 (검토 화면의 "기록 복사") */
export function recordText(S: Session, now: number): string {
  const sm = summarize(S, now);
  const lines = [
    `[운동 기록] ${sm.title} · 세션 ID ${S.id}`,
    `시작 ${hm(sm.start)} · 종료 ${hm(sm.end)} · 총 ${dur(sm.total * 1000)} · 운동 ${dur(sm.work * 1000)} · 휴식 ${dur(sm.rest * 1000)} · ${sm.full ? '전부' : '중간에 끝냄'}`,
  ];
  for (const x of sm.sets) {
    lines.push(`${x.ex} ${x.no}세트 · ${x.reps}${x.unit} · ${hms(x.start)}→${hms(x.end)} · 운동 ${x.work}초 · 앞 휴식 ${x.rest === null ? '-' : `${x.rest}초`}${x.extra ? ' · 추가' : ''}${x.edited ? ' · 고침' : ''}`);
  }
  if (S.memo) lines.push(`메모: ${S.memo}`);
  return lines.join('\n');
}

/** 종목 이름 → 짧은 이름 (토스트·표시용) */
export { shortName, findExercise };
