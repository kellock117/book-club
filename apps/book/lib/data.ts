import 'server-only';
import { cache } from 'react';
import { connection } from 'next/server';
import { createAdminClient } from '@me/core/server/supabase';

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data ?? ([] as unknown as T);
}

/**
 * 모임 전체 데이터(작은 규모라 한 번에 읽는다).
 * 데이터 캐시는 쓰지 않는다: 요청마다 DB에서 읽어 항상 최신이다.
 * react cache는 같은 요청 안에서 중복 호출(멤버 확인 + 페이지)만 합친다.
 */
export const getClubData = cache(async () => {
  await connection(); // 빌드 때 미리 렌더링하지 않고 요청 시점에 읽는다
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
});

export type ClubData = Awaited<ReturnType<typeof getClubData>>;
