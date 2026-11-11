import { z } from 'zod';

export const GENRES = ['소설', '고전', '철학/인문', '정치/사회', '에세이', '과학', '경제/경영', '자기계발'] as const;

/** 빈 문자열은 null로 */
export const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max}자까지 쓸 수 있어요`)
    .transform((s) => (s === '' ? null : s));

export const memberSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요').max(20, '이름은 20자까지예요'),
  rotationOrder: z
    .string()
    .trim()
    .min(1, '선정 순서를 입력해 주세요')
    .transform(Number)
    .pipe(z.number('숫자로 입력해 주세요').int('정수로 입력해 주세요').min(1, '1 이상이에요').max(99, '99 이하예요')),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, '#RRGGBB 형식이에요 (예: #8b5e3c)'),
  status: z.enum(['active', 'pending'], '상태를 골라 주세요'),
});

/** "a, b" 또는 줄바꿈으로 구분한 목록 */
export const list = z
  .string()
  .transform((s) =>
    s
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(60, '항목은 60자까지예요')).max(10, '10개까지예요'));

export const pagesField = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : Number(s)))
  .pipe(z.number('숫자로 입력해 주세요').int('정수로 입력해 주세요').min(1, '1쪽 이상이에요').max(10000, '10000쪽 이하예요').nullable());

export const genreField = z
  .string()
  .transform((s) => (s === '' ? null : s))
  .pipe(z.enum(GENRES, '목록에서 골라 주세요').nullable());

export const bookEditSchema = z.object({
  id: z.uuid('책을 찾을 수 없어요'),
  title: z.string().trim().min(1, '제목을 입력해 주세요').max(200, '제목은 200자까지예요'),
  authors: list,
  translators: list,
  publisher: optional(100),
  pages: pagesField,
  genre: genreField,
  description: optional(3000),
});

export const idSchema = z.uuid('대상을 찾을 수 없어요');
