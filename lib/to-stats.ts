import type { ClubData } from '@/lib/data';
import type { StatsAttendee, StatsBook, StatsMeeting, StatsMember, StatsRating } from '@/lib/stats';

/** DB 행(snake_case)을 lib/stats.ts가 받는 모양으로 바꾼다. */
export function toStats(d: ClubData): {
  members: StatsMember[];
  books: StatsBook[];
  meetings: StatsMeeting[];
  attendees: StatsAttendee[];
  ratings: StatsRating[];
} {
  return {
    members: d.members.map((m) => ({ id: m.id, name: m.name, rotationOrder: m.rotation_order, status: m.status as StatsMember['status'] })),
    books: d.books.map((b) => ({ id: b.id, title: b.title, pages: b.pages, status: b.status as StatsBook['status'], selectedBy: b.selected_by })),
    meetings: d.meetings.map((m) => ({ id: m.id, number: m.number, date: m.date, bookId: m.book_id })),
    attendees: d.attendees.map((a) => ({ meetingId: a.meeting_id, memberId: a.member_id })),
    ratings: d.ratings.map((r) => ({ bookId: r.book_id, memberId: r.member_id, score: Number(r.score) })),
  };
}
