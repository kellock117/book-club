import { z } from 'zod';
import { isAllowedCoverUrl } from '../books/cover';
import { genreField, list, optional, pagesField } from './admin';

/** 검색에서 고르거나 직접 입력한 책 정보 (추천·선정 화면 공통) */
export const bookFieldsSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해 주세요').max(200, '제목은 200자까지예요'),
  authors: list,
  translators: list,
  publisher: optional(100),
  publishedDate: z
    .string()
    .trim()
    .transform((s) => (s === '' ? null : s))
    .pipe(z.iso.date('날짜 형식이 맞지 않아요').nullable()),
  isbn13: z
    .string()
    .trim()
    .transform((s) => (s === '' ? null : s))
    .pipe(z.string().regex(/^\d{13}$/, 'ISBN은 13자리 숫자예요').nullable()),
  pages: pagesField,
  genre: genreField,
  description: optional(3000),
  coverUrl: z
    .string()
    .trim()
    .transform((s) => (s === '' ? null : s))
    .pipe(z.string().refine(isAllowedCoverUrl, '표지 주소를 쓸 수 없어요').nullable()),
  infoSource: z.enum(['kakao', 'manual'], '정보 출처를 알 수 없어요'),
});
export type BookFields = z.infer<typeof bookFieldsSchema>;

const reason = (label: string) => z.string().trim().min(1, `${label}를 적어 주세요`).max(500, '500자까지 쓸 수 있어요');

/** 책 추천하기 */
export const recommendSchema = bookFieldsSchema.extend({ reason: reason('추천 이유') });

const selectCommon = {
  selectedBy: z.uuid('선정자를 골라 주세요'),
  reason: reason('선정 이유'),
  date: z.iso.date('모임 날짜를 골라 주세요'),
};
/** 이번 달 책 정하기: 위시리스트에서 고르기 */
export const selectExistingSchema = z.object({ bookId: z.uuid('책을 골라 주세요'), ...selectCommon });
/** 이번 달 책 정하기: 새로 검색한 책 */
export const selectNewSchema = bookFieldsSchema.extend(selectCommon);

/** 모임 기록하기 */
export const meetingSchema = z.object({
  id: z.uuid('모임을 찾을 수 없어요'),
  date: z.iso.date('날짜를 골라 주세요'),
  place: optional(100),
  questions: optional(3000),
  attendees: z.array(z.uuid()),
  intent: z.enum(['save', 'finish']),
});
