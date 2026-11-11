import 'server-only';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

/** 읽기 캐시 태그. 쓰기 뒤에는 revalidateTag(CLUB_TAG, { expire: 0 })로 비운다. */
export const CLUB_TAG = 'club';

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data ?? ([] as unknown as T);
}

/** 모임 전체 데이터(작은 규모라 한 번에 읽는다). unstable_cache + 태그 `club`. */
export const getClubData = unstable_cache(
  async () => {
    const db = createAdminClient();
    const [members, books, meetings, attendees, ratings, interests] = await Promise.all([
      db.from('members').select('*').order('rotation_order'),
      db.from('books').select('*').order('created_at'),
      db.from('meetings').select('*').order('number'),
      db.from('meeting_attendees').select('*'),
      db.from('ratings').select('*'),
      db.from('book_interests').select('*'),
    ]);
    return {
      members: must(members, 'members'),
      books: must(books, 'books'),
      meetings: must(meetings, 'meetings'),
      attendees: must(attendees, 'meeting_attendees'),
      ratings: must(ratings, 'ratings'),
      interests: must(interests, 'book_interests'),
    };
  },
  // 키 이름을 바꾸면 이전 캐시(빈 DB 시절의 결과 등)를 버리고 새로 읽는다.
  // revalidate는 안전망: 쓰기 경로를 거치지 않고 DB를 직접 바꿔도 10분 안에 반영된다.
  ['club-data', 'v2'],
  { tags: [CLUB_TAG], revalidate: 600 },
);

export type ClubData = Awaited<ReturnType<typeof getClubData>>;
