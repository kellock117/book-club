'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth/member';
import { createAdminClient } from '@me/core/server/supabase';
import { meetingSchema } from '@/lib/validation/book';

export type MeetingState = {
  errors?: Record<string, string[]>;
  values?: { date: string; place: string; questions: string; attendees: string[] };
};

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');

export async function saveMeeting(_prev: MeetingState, formData: FormData): Promise<MeetingState> {
  const raw = {
    id: str(formData.get('id')),
    date: str(formData.get('date')),
    place: str(formData.get('place')),
    questions: str(formData.get('questions')),
    attendees: formData.getAll('attendees').filter((v): v is string => typeof v === 'string'),
    intent: str(formData.get('intent')),
  };
  const values = { date: raw.date, place: raw.place, questions: raw.questions, attendees: raw.attendees };

  const me = await getCurrentMember();
  if (!me) redirect('/who');

  const parsed = meetingSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const input = parsed.data;

  const db = createAdminClient();
  const { data: meeting } = await db.from('meetings').select('id,book_id').eq('id', input.id).maybeSingle();
  if (!meeting) return { errors: { form: ['없는 모임이에요'] }, values };

  // 활동 중인 멤버만 참석자로 받는다
  const { data: active } = await db.from('members').select('id').eq('status', 'active');
  const activeIds = new Set((active ?? []).map((m) => m.id));
  const attendees = [...new Set(input.attendees)].filter((id) => activeIds.has(id));

  const { error } = await db.from('meetings').update({ date: input.date, place: input.place, questions: input.questions }).eq('id', input.id);
  if (error) return { errors: { form: ['저장하지 못했어요. 잠시 뒤에 다시 해 주세요'] }, values };

  // 참석자: 비교해서 빠진 사람은 지우고 새로 온 사람은 넣는다
  const { data: current } = await db.from('meeting_attendees').select('member_id').eq('meeting_id', input.id);
  const have = new Set((current ?? []).map((a) => a.member_id));
  const toRemove = [...have].filter((id) => !attendees.includes(id));
  const toAdd = attendees.filter((id) => !have.has(id));
  if (toRemove.length) await db.from('meeting_attendees').delete().eq('meeting_id', input.id).in('member_id', toRemove);
  if (toAdd.length) {
    const { error: addError } = await db.from('meeting_attendees').insert(toAdd.map((member_id) => ({ meeting_id: input.id, member_id })));
    if (addError) return { errors: { form: ['참석자를 저장하지 못했어요. 다시 해 주세요'] }, values };
  }

  if (input.intent === 'finish') {
    if (!meeting.book_id) return { errors: { form: ['이 모임에는 책이 정해져 있지 않아요'] }, values };
    const { error: doneError } = await db.from('books').update({ status: 'done' }).eq('id', meeting.book_id);
    if (doneError) return { errors: { form: ['책 상태를 바꾸지 못했어요. 다시 해 주세요'] }, values };
    revalidatePath('/', 'layout');
    redirect(`/rate?book=${meeting.book_id}`);
  }

  revalidatePath('/', 'layout');
  redirect('/meetings?toast=saved');
}
