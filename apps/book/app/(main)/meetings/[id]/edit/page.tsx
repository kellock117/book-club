import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fmtDate } from '@/lib/format';
import { getView } from '@/lib/view';
import { MeetingForm } from './meeting-form';

export const metadata: Metadata = { title: '모임 기록하기 · 독서 모임' };

export default async function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, bookById } = await getView();
  const meeting = data.meetings.find((m) => m.id === id);
  if (!meeting) notFound();

  const book = meeting.book_id ? bookById.get(meeting.book_id) : undefined;
  const members = data.members.filter((m) => m.status === 'active').sort((a, b) => a.rotation_order - b.rotation_order);
  const recorded = data.attendees.filter((a) => a.meeting_id === id).map((a) => a.member_id);
  // 아직 참석자 기록이 없으면 활동 중인 멤버 전원을 체크해 둔다
  const attendeeIds = recorded.length ? recorded : members.map((m) => m.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{meeting.number}회 모임 기록하기</h1>
        <p className="mt-1 text-muted">
          {book ? `${book.title} · ` : ''}
          {fmtDate(meeting.date)}
        </p>
      </div>
      <MeetingForm
        meeting={{ id: meeting.id, date: meeting.date, place: meeting.place ?? '', questions: meeting.questions ?? '' }}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        attendeeIds={attendeeIds}
        canFinish={book?.status === 'reading'}
      />
    </div>
  );
}
