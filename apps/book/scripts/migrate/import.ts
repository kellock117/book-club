import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@me/core/database';
import type { Snapshot } from './snapshot';

type Db = SupabaseClient<Database>;

const STATUS_MAP: Record<string, 'wishlist' | 'reading' | 'done'> = {
  위시리스트: 'wishlist',
  '읽는 중': 'reading',
  완료: 'done',
};
const MEMBER_STATUS_MAP: Record<string, 'active' | 'pending'> = {
  '활동 중': 'active',
  '합류 예정': 'pending',
};
// 새로 만드는 멤버의 임시 색. 이미 있는 멤버의 색은 건드리지 않는다.
const FALLBACK_COLORS = ['#C2410C', '#0F766E', '#4338CA', '#A16207'];

export function parseMeetingNumber(title: string): number {
  const m = title.match(/^\s*제\s*(\d+)\s*회/);
  if (!m?.[1]) throw new Error(`회차 제목에서 숫자를 찾을 수 없음: "${title}"`);
  return Number.parseInt(m[1], 10);
}

/** "나래 · 책 제목" 형식의 임시값이면 빈 값으로 본다. */
export function cleanOneLiner(oneLiner: string, memberName: string | undefined, bookTitle: string | undefined) {
  const v = oneLiner.trim();
  if (!v) return null;
  if (memberName && bookTitle && v === `${memberName} · ${bookTitle}`) return null;
  return v;
}

export function splitAuthors(raw: string): string[] {
  return raw
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const blankToNull = (s: string) => (s.trim() === '' ? null : s.trim());

function check<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  if (res.data == null) throw new Error(`${what}: 응답이 비어 있음`);
  return res.data;
}

/** 반환값이 필요 없는 쓰기(update/upsert)용 */
function ok(res: { error: { message: string } | null }, what: string): void {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
}

export type ImportResult = {
  members: Map<string, string>; // 노션 ID → uuid
  books: Map<string, string>;
};

/** 스냅샷을 DB에 반영한다. 다시 실행해도 개수가 늘지 않도록 제목·회차·이름·(책,멤버) 기준으로 upsert한다. */
export async function importSnapshot(db: Db, snap: Snapshot, log: (s: string) => void = console.log): Promise<ImportResult> {
  // 같은 제목이 둘이면 제목 기준 upsert가 모호해진다
  const titles = snap.books.map((b) => b.title);
  const dup = titles.find((t, i) => titles.indexOf(t) !== i);
  if (dup) throw new Error(`노션에 같은 제목의 책이 둘 이상 있음: "${dup}"`);

  // ── members (이름 기준)
  const memberIds = new Map<string, string>();
  const existingMembers = check(await db.from('book_members').select('id,name'), 'members 조회');
  const memberByName = new Map(existingMembers.map((m) => [m.name, m.id]));
  let colorIdx = existingMembers.length;
  for (const [i, m] of snap.members.entries()) {
    const status = MEMBER_STATUS_MAP[m.status ?? '활동 중'] ?? 'active';
    const rotation = m.rotationOrder ?? i + 1;
    const existingId = memberByName.get(m.name);
    if (existingId) {
      ok(await db.from('book_members').update({ rotation_order: rotation, status }).eq('id', existingId), `멤버 수정(${m.name})`);
      memberIds.set(m.id, existingId);
    } else {
      const color = FALLBACK_COLORS[colorIdx++ % FALLBACK_COLORS.length]!;
      const row = check(
        await db.from('book_members').insert({ name: m.name, rotation_order: rotation, status, color }).select('id').single(),
        `멤버 추가(${m.name})`,
      );
      memberIds.set(m.id, row.id);
    }
  }
  const memberName = new Map(snap.members.map((m) => [m.id, m.name]));
  const member = (notionPageId: string | null | undefined, what: string) => {
    if (!notionPageId) return null;
    const id = memberIds.get(notionPageId);
    if (!id) throw new Error(`${what}: 알 수 없는 멤버 ${notionPageId}`);
    return id;
  };
  log(`멤버 ${snap.members.length}명 반영`);

  // ── books (제목 기준)
  const bookIds = new Map<string, string>();
  const existingBooks = check(await db.from('book_books').select('id,title'), 'books 조회');
  const bookByTitle = new Map(existingBooks.map((b) => [b.title, b.id]));
  for (const b of snap.books) {
    const status = STATUS_MAP[b.status];
    if (!status) throw new Error(`알 수 없는 책 상태 "${b.status}" (${b.title})`);
    const payload: Database['public']['Tables']['book_books']['Update'] = {
      title: b.title,
      authors: splitAuthors(b.authors),
      genre: b.genre,
      status,
      selected_by: member(b.selectedBy[0], `${b.title} 선정자`),
      selection_reason: blankToNull(b.selectionReason),
      recommended_by: member(b.recommendedBy[0], `${b.title} 추천자`),
      recommend_reason: blankToNull(b.recommendReason),
    };
    if (b.pages != null) payload.pages = b.pages; // 비어 있으면 알라딘으로 채운 값을 지우지 않는다
    const existingId = bookByTitle.get(b.title);
    if (existingId) {
      ok(await db.from('book_books').update(payload).eq('id', existingId), `책 수정(${b.title})`);
      bookIds.set(b.id, existingId);
    } else {
      const row = check(
        await db.from('book_books').insert({ ...payload, title: b.title, info_source: 'manual' }).select('id').single(),
        `책 추가(${b.title})`,
      );
      bookIds.set(b.id, row.id);
    }
  }
  const book = (notionPageId: string | null | undefined, what: string) => {
    if (!notionPageId) return null;
    const id = bookIds.get(notionPageId);
    if (!id) throw new Error(`${what}: 알 수 없는 책 ${notionPageId}`);
    return id;
  };
  log(`책 ${snap.books.length}권 반영`);

  // ── book_interests
  const interests = snap.books.flatMap((b) =>
    b.interestedMemberIds.map((mid) => ({ book_id: book(b.id, '관심')!, member_id: member(mid, `${b.title} 관심`)! })),
  );
  if (interests.length) {
    ok(await db.from('book_interests').upsert(interests, { onConflict: 'book_id,member_id', ignoreDuplicates: true }), 'book_interests');
  }
  log(`나도 읽고 싶어요 ${interests.length}건 반영`);

  // ── meetings (회차 기준)
  const meetingIds = new Map<string, string>();
  for (const mt of snap.meetings) {
    const number = parseMeetingNumber(mt.title);
    if (!mt.date) throw new Error(`모임 "${mt.title}"에 날짜가 없음`);
    const row = check(
      await db
        .from('book_meetings')
        .upsert(
          {
            number,
            date: mt.date,
            book_id: book(mt.bookIds[0], `${mt.title} 책`),
            place: blankToNull(mt.place),
            questions: blankToNull(mt.questions),
          },
          { onConflict: 'number' },
        )
        .select('id')
        .single(),
      `모임 upsert(${mt.title})`,
    );
    meetingIds.set(mt.id, row.id);
  }
  log(`모임 ${snap.meetings.length}회 반영`);

  // ── meeting_attendees
  const attendees = snap.meetings.flatMap((mt) =>
    mt.attendeeIds.map((mid) => ({ meeting_id: meetingIds.get(mt.id)!, member_id: member(mid, `${mt.title} 참석자`)! })),
  );
  if (attendees.length) {
    ok(await db.from('book_meeting_attendees').upsert(attendees, { onConflict: 'meeting_id,member_id', ignoreDuplicates: true }), 'book_meeting_attendees');
  }
  log(`참석 기록 ${attendees.length}건 반영`);

  // ── ratings ((책, 멤버) 기준). 사이트를 쓰기 시작한 뒤에는 다시 실행하지 않는다: 새 사이트에서 고친 평점을 덮어쓴다.
  const bookTitleByNotionId = new Map(snap.books.map((b) => [b.id, b.title]));
  const ratingRows = snap.ratings.map((r, i) => {
    if (r.score == null) throw new Error(`평점 #${i + 1}에 별점이 없음`);
    if (r.score < 0.5 || r.score > 5 || (r.score * 2) % 1 !== 0) throw new Error(`평점 #${i + 1}의 별점 ${r.score}은 0.5~5, 0.5 단위가 아님`);
    const oneLiner = cleanOneLiner(r.oneLiner, r.memberId ? memberName.get(r.memberId) : undefined, r.bookId ? bookTitleByNotionId.get(r.bookId) : undefined);
    if (oneLiner && oneLiner.length > 80) throw new Error(`평점 #${i + 1}의 한 줄 평이 80자를 넘음`);
    return {
      book_id: book(r.bookId, `평점 #${i + 1} 책`)!,
      member_id: member(r.memberId, `평점 #${i + 1} 멤버`)!,
      score: r.score,
      one_liner: oneLiner,
      quote: blankToNull(r.quote),
    };
  });
  if (ratingRows.length) {
    ok(await db.from('book_ratings').upsert(ratingRows, { onConflict: 'book_id,member_id' }), 'book_ratings');
  }
  log(`평점 ${ratingRows.length}개 반영`);

  return { members: memberIds, books: bookIds };
}

export async function countRows(db: Db) {
  const tables = ['book_members', 'book_books', 'book_interests', 'book_meetings', 'book_meeting_attendees', 'book_ratings'] as const;
  const out: Record<string, number> = {};
  for (const t of tables) {
    const { count, error } = await db.from(t).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`${t} 개수 조회: ${error.message}`);
    out[t] = count ?? 0;
  }
  return out;
}
