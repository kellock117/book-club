import { describe, expect, it } from 'vitest';
import {
  buildPlan, canStart, currentItemIndex, dur, flagsOf, hm, newSet, parseTimeValue, restOf, summarize, timeValue, workoutDate,
  type Session, type SetRec,
} from './calc';

/** 서울 시각 → epoch ms (테스트 입력을 읽기 쉽게) */
const kst = (iso: string): number => Date.parse(`${iso}+09:00`);

/** 끝난 세트 */
const done = (id: string, a: string, b: string, reps = 10): SetRec => ({ ...newSet(reps, false, id), st: 'done', start: kst(a), end: kst(b) });

const session = (items: Session['items']): Session => ({ v: 1, id: 's1', part: 'lower', items, ended: null, review: false, saved: false, memo: '', note: '', open: {} });

describe('workoutDate: 새벽 5시 전 시작은 전날', () => {
  it('04:59는 전날, 05:00는 당일', () => {
    expect(workoutDate(kst('2026-11-10T04:59:59'))).toBe('2026-11-09');
    expect(workoutDate(kst('2026-11-10T05:00:00'))).toBe('2026-11-10');
  });
  it('서버가 UTC여도 서울 기준으로 센다 (UTC 19:59 = 서울 04:59)', () => {
    expect(workoutDate(Date.parse('2026-11-09T19:59:00Z'))).toBe('2026-11-09');
    expect(workoutDate(Date.parse('2026-11-09T20:00:00Z'))).toBe('2026-11-10');
  });
});

describe('시각 표시와 입력', () => {
  it('서울 시각으로 표시한다', () => {
    expect(hm(Date.parse('2026-11-10T05:05:00Z'))).toBe('14:05');
    expect(timeValue(kst('2026-11-10T09:03:07'))).toBe('09:03:07');
  });
  it('dur: 분:초, 1시간 넘으면 시:분:초, 음수는 −', () => {
    expect(dur(90_000)).toBe('1:30');
    expect(dur(3_725_000)).toBe('1:02:05');
    expect(dur(-5000)).toBe('−0:05');
  });
  it('parseTimeValue: 자정을 넘겨도 기준 시각 근처 날짜로 맞춘다', () => {
    const ref = kst('2026-11-10T00:10:00');
    expect(parseTimeValue('23:58:00', ref)).toBe(kst('2026-11-09T23:58:00'));
    expect(parseTimeValue('00:12', ref)).toBe(kst('2026-11-10T00:12:00'));
    expect(parseTimeValue('이상한 값', ref)).toBeNull();
    expect(parseTimeValue('', ref)).toBeNull();
  });
});

describe('휴식과 합계', () => {
  const S = session([
    { n: '템포 스쿼트', unit: '회', sets: [done('a', '2026-11-10T10:00:00', '2026-11-10T10:00:40'), done('b', '2026-11-10T10:02:10', '2026-11-10T10:02:50')] },
    { n: '한 다리 힙 브릿지', unit: '회', sets: [done('c', '2026-11-10T10:04:20', '2026-11-10T10:05:00')] },
  ]);
  it('휴식 = 이전 세트 끝 → 이번 세트 시작 (종목이 바뀌어도 이어서 센다)', () => {
    expect(restOf(S, S.items[0]!.sets[0]!)).toBeNull();
    expect(restOf(S, S.items[0]!.sets[1]!)).toBe(90);
    expect(restOf(S, S.items[1]!.sets[0]!)).toBe(90);
  });
  it('운동 시간 합·휴식 합·총 시간', () => {
    const sm = summarize({ ...S, ended: kst('2026-11-10T10:05:00') }, kst('2026-11-10T12:00:00'));
    expect(sm.work).toBe(120);
    expect(sm.rest).toBe(180);
    expect(sm.total).toBe(300);
    expect(sm.sets.map((x) => `${x.ex}${x.no}`)).toEqual(['템포 스쿼트1', '템포 스쿼트2', '한 다리 힙 브릿지1']);
    expect(sm.title).toBe('11/10 (화) 하체');
  });
  it('끝나지 않은 세트(plan)는 합계에 넣지 않고, 추가 세트는 "전부" 판정에 영향이 없다', () => {
    const plan = newSet(10, false, 'p');
    const extra = { ...newSet(10, true, 'x') };
    expect(summarize(session([{ n: '템포 스쿼트', unit: '회', sets: [done('a', '2026-11-10T10:00:00', '2026-11-10T10:00:30'), plan] }]), 0).full).toBe(false);
    expect(summarize(session([{ n: '템포 스쿼트', unit: '회', sets: [done('a', '2026-11-10T10:00:00', '2026-11-10T10:00:30'), extra] }]), 0).full).toBe(true);
  });
  it('flagsOf: 휴식 30분 초과·음수, 운동 10분 초과를 표시한다', () => {
    const long = session([{ n: '템포 스쿼트', unit: '회', sets: [done('a', '2026-11-10T10:00:00', '2026-11-10T10:00:30'), done('b', '2026-11-10T10:40:00', '2026-11-10T10:51:00')] }]);
    const f = flagsOf(summarize(long, kst('2026-11-10T11:00:00')));
    expect(f.map((x) => x.text)).toEqual(['휴식 39:30', '운동 11:00']);
  });
});

describe('순서 잠금 canStart / currentItemIndex', () => {
  const mk = (a: SetRec[], b: SetRec[]) => session([{ n: '템포 스쿼트', unit: '회', sets: a }, { n: '한 다리 힙 브릿지', unit: '회', sets: b }]);
  it('앞 세트를 끝내야 다음 세트가 열린다', () => {
    const S = mk([newSet(10, false, 'a'), newSet(10, false, 'b')], [newSet(10, false, 'c')]);
    expect(canStart(S, 0, 0)).toBe(true);
    expect(canStart(S, 0, 1)).toBe(false);
    expect(canStart(S, 1, 0)).toBe(false);
  });
  it('하는 중인 세트가 있으면 아무것도 못 시작한다', () => {
    const S = mk([{ ...newSet(10, false, 'a'), st: 'run', start: 1 }, newSet(10, false, 'b')], [newSet(10, false, 'c')]);
    expect(canStart(S, 0, 1)).toBe(false);
    expect(currentItemIndex(S)).toBe(0);
  });
  it('건너뛰기로 예정 세트를 치우면 다음 종목이 열린다', () => {
    const S = mk([done('a', '2026-11-10T10:00:00', '2026-11-10T10:00:30')], [newSet(10, false, 'c')]);
    expect(canStart(S, 1, 0)).toBe(true);
    expect(currentItemIndex(S)).toBe(1);
  });
  it('모두 끝나면 currentItemIndex는 -1', () => {
    expect(currentItemIndex(mk([done('a', '2026-11-10T10:00:00', '2026-11-10T10:00:30')], [done('c', '2026-11-10T10:02:00', '2026-11-10T10:02:30')]))).toBe(-1);
  });
});

describe('buildPlan: 지난 기록에서 예정 세트 만들기', () => {
  let n = 0;
  const id = () => `id${++n}`;
  it('지난 기록이 없으면 기본 횟수로 3세트', () => {
    const items = buildPlan('lower', {}, id);
    expect(items.map((i) => i.n)).toEqual(['불가리안 스플릿 스쿼트', '템포 스쿼트', '한 다리 루마니안 데드리프트', '한 다리 힙 브릿지', '한 발 카프 레이즈']);
    expect(items[0]!.sets.map((s) => s.reps)).toEqual([8, 8, 8]);
    expect(items[4]!.sets.map((s) => s.reps)).toEqual([15, 15, 15]);
  });
  it('지난 기록이 있으면 그 세트 수·횟수를 따른다 (횟수 0은 기본값)', () => {
    const items = buildPlan('lower', { '불가리안 스플릿 스쿼트': [{ n: 1, r: 12 }, { n: 2, r: 12 }, { n: 3, r: 0 }, { n: 4, r: 10 }] }, id);
    expect(items[0]!.sets.map((s) => s.reps)).toEqual([12, 12, 8, 10]);
    expect(items[1]!.sets).toHaveLength(3);
  });
  it('세트 id는 모두 다르다', () => {
    const ids = buildPlan('upper', {}, id).flatMap((i) => i.sets.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
