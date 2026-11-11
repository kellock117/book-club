'use server';

/**
 * 운동 앱의 서버 액션. 모든 액션은 첫 줄에서 requireSite()로 잠금을 다시 확인한다
 * (서버 액션은 주소로 직접 호출될 수 있어서 proxy.ts만 믿지 않는다).
 */
import { requireSite } from '@me/core/server/require-site';
import { deleteDraft, putDraft, saveSession } from '@/lib/data';
import { APP_ID, PASSWORD_ENV } from '@/lib/site';
import { finishSchema, MAX_DRAFT_BYTES } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

/** 진행 중인 운동을 서버에도 임시 저장한다 (화면이 디바운스해서 부른다). null이면 임시 저장을 지운다. */
export async function saveDraft(state: unknown): Promise<ActionResult> {
  await requireSite(APP_ID, PASSWORD_ENV);
  try {
    if (state === null) await deleteDraft();
    else {
      if (JSON.stringify(state).length > MAX_DRAFT_BYTES) return { ok: false, error: '임시 저장이 너무 커요' };
      await putDraft(state);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '임시 저장에 실패했어요' };
  }
}

/** 운동을 끝내고 저장한다. 성공하면 임시 저장도 지운다. */
export async function finishWorkout(input: unknown): Promise<ActionResult> {
  await requireSite(APP_ID, PASSWORD_ENV);
  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? '저장할 값을 확인해 주세요' };
  try {
    await saveSession(parsed.data);
    await deleteDraft();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '저장에 실패했어요' };
  }
}
