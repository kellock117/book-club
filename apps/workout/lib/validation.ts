/**
 * 서버 액션이 받는 값의 검증 규칙(zod). 화면에서 온 값은 믿지 않고 여기서 한 번 걸러서 DB에 넣는다.
 */
import { z } from 'zod';

const ms = z.number().int().positive();

export const finishSchema = z
  .object({
    /** 화면이 만든 세션 id. 같은 id로 다시 저장하면 덮어쓴다(저장 도중 끊겨도 다시 눌러도 안전) */
    id: z.string().min(1).max(64),
    part: z.enum(['lower', 'upper']),
    startedAt: ms,
    endedAt: ms,
    /** 계획한 세트를 모두 끝냈는가 */
    finished: z.boolean(),
    memo: z.string().max(2000),
    sets: z
      .array(
        z.object({
          exercise: z.string().min(1).max(100),
          ord: z.number().int().min(1).max(50),
          setNo: z.number().int().min(1).max(100),
          reps: z.number().int().min(0).max(1000),
          unit: z.enum(['회', '초']),
          startedAt: ms,
          endedAt: ms,
          extra: z.boolean(),
          edited: z.boolean(),
        }),
      )
      .min(1)
      .max(200),
  })
  .refine((v) => v.endedAt >= v.startedAt, { message: '종료가 시작보다 빠를 수 없어요' });

export type FinishInput = z.infer<typeof finishSchema>;

/** 임시 저장(draft)은 화면 상태를 통째로 받는다. 내용 모양은 화면이 책임지고, 여기서는 크기만 제한한다. */
export const MAX_DRAFT_BYTES = 200_000;
