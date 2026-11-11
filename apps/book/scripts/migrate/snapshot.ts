import { z } from 'zod';

/** 노션에서 읽어 온 데이터를 정리한 중간 형태. id는 하이픈 없는 소문자 32자리 노션 페이지 ID. */
export const snapshotSchema = z.object({
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      rotationOrder: z.number().nullable(),
      status: z.string().nullable(), // "활동 중" | "합류 예정"
    }),
  ),
  books: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      authors: z.string(), // 노션 "저자" 텍스트 원문
      genre: z.string().nullable(),
      status: z.string(), // "위시리스트" | "읽는 중" | "완료"
      pages: z.number().nullable(),
      selectionReason: z.string(),
      recommendReason: z.string(),
      selectedBy: z.array(z.string()),
      recommendedBy: z.array(z.string()),
      interestedMemberIds: z.array(z.string()), // "나도 읽고 싶어요"
    }),
  ),
  meetings: z.array(
    z.object({
      id: z.string(),
      title: z.string(), // "제N회 · …"
      date: z.string().nullable(),
      place: z.string(),
      questions: z.string(),
      bookIds: z.array(z.string()),
      attendeeIds: z.array(z.string()),
    }),
  ),
  ratings: z.array(
    z.object({
      id: z.string(),
      bookId: z.string().nullable(),
      memberId: z.string().nullable(),
      score: z.number().nullable(),
      oneLiner: z.string(), // 한 줄 평(제목 속성)
      quote: z.string(),
    }),
  ),
});

export type Snapshot = z.infer<typeof snapshotSchema>;

/** 노션 URL·UUID에서 32자리 hex ID를 뽑는다. */
export function notionId(urlOrId: string): string {
  const m = urlOrId.replace(/-/g, '').match(/[0-9a-f]{32}/i);
  if (!m) throw new Error(`노션 ID를 찾을 수 없음: ${urlOrId}`);
  return m[0].toLowerCase();
}
