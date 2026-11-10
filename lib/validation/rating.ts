import { z } from 'zod';

export const ONE_LINER_MAX = 80;
export const QUOTE_MAX = 500;

/** 평점 입력. 별점은 0.5~5, 0.5 단위 (DB 제약과 같은 규칙). */
export const ratingInputSchema = z.object({
  bookId: z.string().uuid('책을 골라 주세요'),
  // 빈 값("")이 0으로 바뀌어 "0.5점 이상" 메시지가 나오지 않도록 먼저 비어 있는지 본다
  score: z
    .string('별점을 골라 주세요')
    .trim()
    .min(1, '별점을 골라 주세요')
    .transform((s) => Number(s))
    .pipe(
      z
        .number('별점을 골라 주세요')
        .min(0.5, '별점은 0.5점 이상이에요')
        .max(5, '별점은 5점 이하예요')
        .refine((n) => Number.isInteger(n * 2), '별점은 0.5점 단위예요'),
    ),
  oneLiner: z
    .string()
    .trim()
    .min(1, '한 줄 평을 적어 주세요')
    .max(ONE_LINER_MAX, `한 줄 평은 ${ONE_LINER_MAX}자까지예요`),
  quote: z
    .string()
    .trim()
    .max(QUOTE_MAX, `인상 깊은 문장은 ${QUOTE_MAX}자까지예요`)
    .transform((s) => (s === '' ? null : s)),
});

export type RatingInput = z.infer<typeof ratingInputSchema>;
