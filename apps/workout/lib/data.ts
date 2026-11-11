/**
 * 운동 앱의 DB 접근(서버 전용). Supabase는 서버에서 secret 키로만 부른다.
 * 읽기는 서버 컴포넌트(page.tsx), 쓰기는 서버 액션(actions.ts)이 이 파일의 함수를 쓴다.
 */
import 'server-only';
import { createAdminClient } from '@me/core/server/supabase';
import { workoutDate, type PrevSets, type Session } from './calc';
import type { Part } from './exercises';
import type { FinishInput } from './validation';

/** 임시 저장은 한 줄(id='current')만 쓴다 */
const DRAFT_ID = 'current';

export interface PrevInfo {
  prev: PrevSets;
  /** 지난 기록의 날짜(YYYY-MM-DD). 기록이 없으면 null */
  date: string | null;
}

/**
 * 같은 구분(상체/하체)의 가장 최근 운동에서 종목별 세트 번호·횟수를 읽는다.
 * "가장 최근"은 날짜 → 시작 시각 순. 시각이 없는 옛 기록(11/09)은 같은 날짜 안에서 뒤로 간다.
 */
export async function getPrevSets(part: Part): Promise<PrevInfo> {
  const db = createAdminClient();
  const { data: last, error } = await db
    .from('workout_sessions')
    .select('id, date')
    .eq('part', part)
    .order('date', { ascending: false })
    .order('started_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`지난 기록을 읽지 못했어요: ${error.message}`);
  if (!last) return { prev: {}, date: null };

  const { data: sets, error: e2 } = await db
    .from('workout_sets')
    .select('exercise, set_no, reps')
    .eq('session_id', last.id)
    .order('ord')
    .order('set_no');
  if (e2) throw new Error(`지난 세트를 읽지 못했어요: ${e2.message}`);

  const prev: PrevSets = {};
  for (const s of sets ?? []) (prev[s.exercise] ??= []).push({ n: s.set_no, r: s.reps ?? 0 });
  return { prev, date: last.date };
}

/** 진행 중이던 운동의 임시 저장(다른 기기에서 이어하기용). 없으면 null. */
export async function getDraft(): Promise<Session | null> {
  const { data, error } = await createAdminClient().from('workout_drafts').select('state').eq('id', DRAFT_ID).maybeSingle();
  if (error) throw new Error(`임시 저장을 읽지 못했어요: ${error.message}`);
  return (data?.state as unknown as Session | null) ?? null;
}

export async function putDraft(state: unknown): Promise<void> {
  const { error } = await createAdminClient()
    .from('workout_drafts')
    .upsert({ id: DRAFT_ID, state: state as never, updated_at: new Date().toISOString() });
  if (error) throw new Error(`임시 저장에 실패했어요: ${error.message}`);
}

export async function deleteDraft(): Promise<void> {
  const { error } = await createAdminClient().from('workout_drafts').delete().eq('id', DRAFT_ID);
  if (error) throw new Error(`임시 저장을 지우지 못했어요: ${error.message}`);
}

/**
 * 끝난 운동을 저장한다. 세션 id로 upsert하고 세트는 지웠다가 다시 넣어서, 몇 번을 눌러도 결과가 같다(멱등).
 * 날짜는 클라이언트 값이 아니라 시작 시각에서 서버가 계산한다 (새벽 5시 전은 전날).
 */
export async function saveSession(input: FinishInput): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from('workout_sessions').upsert({
    id: input.id,
    part: input.part,
    date: workoutDate(input.startedAt),
    started_at: new Date(input.startedAt).toISOString(),
    ended_at: new Date(input.endedAt).toISOString(),
    finished: input.finished,
    memo: input.memo || null,
  });
  if (error) throw new Error(`운동 기록 저장에 실패했어요: ${error.message}`);

  const del = await db.from('workout_sets').delete().eq('session_id', input.id);
  if (del.error) throw new Error(`이전 세트를 정리하지 못했어요: ${del.error.message}`);

  const { error: e2 } = await db.from('workout_sets').insert(
    input.sets.map((s) => ({
      session_id: input.id,
      exercise: s.exercise,
      ord: s.ord,
      set_no: s.setNo,
      reps: s.reps,
      unit: s.unit,
      started_at: new Date(s.startedAt).toISOString(),
      ended_at: new Date(s.endedAt).toISOString(),
      // 무게 등 나중에 늘릴 값을 위한 칸. 지금은 "추가 세트"만 표시한다.
      extra: s.extra ? { added: true } : null,
      edited: s.edited,
    })),
  );
  if (e2) throw new Error(`세트 저장에 실패했어요: ${e2.message}`);
}
