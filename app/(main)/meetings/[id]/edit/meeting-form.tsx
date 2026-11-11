'use client';

import { useActionState } from 'react';
import { saveMeeting, type MeetingState } from './actions';

type Props = {
  meeting: { id: string; date: string; place: string; questions: string };
  members: { id: string; name: string }[];
  attendeeIds: string[];
  /** 책이 아직 읽는 중일 때만 "모임 끝" 버튼을 보인다 */
  canFinish: boolean;
};

const input = 'min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base';

export function MeetingForm({ meeting, members, attendeeIds, canFinish }: Props) {
  const [state, action, pending] = useActionState<MeetingState, FormData>(saveMeeting, {});
  const e = state.errors ?? {};
  const v = state.values;
  const checked = new Set(v?.attendees ?? attendeeIds);

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="id" value={meeting.id} />

      <div>
        <label htmlFor="date" className="mb-2 block text-sm font-medium">
          날짜
        </label>
        <input id="date" name="date" type="date" defaultValue={v?.date ?? meeting.date} className={input} aria-invalid={e.date ? true : undefined} />
        {e.date && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.date[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="place" className="mb-2 block text-sm font-medium">
          장소
        </label>
        <input id="place" name="place" defaultValue={v?.place ?? meeting.place} autoComplete="off" className={input} />
        {e.place && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.place[0]}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">참석자</legend>
        <ul className="grid grid-cols-1 gap-2">
          {members.map((m) => (
            <li key={m.id}>
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4">
                <input type="checkbox" name="attendees" value={m.id} defaultChecked={checked.has(m.id)} className="size-5 accent-accent" />
                <span className="text-base">{m.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label htmlFor="questions" className="mb-2 block text-sm font-medium">
          발제 질문
        </label>
        <textarea id="questions" name="questions" rows={6} defaultValue={v?.questions ?? meeting.questions} className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base" />
        {e.questions && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {e.questions[0]}
          </p>
        )}
      </div>

      {e.form && (
        <p role="alert" className="text-sm font-medium text-danger">
          {e.form[0]}
        </p>
      )}

      <div className="space-y-3">
        <button type="submit" name="intent" value="save" disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-60">
          {pending ? '저장 중…' : '저장'}
        </button>
        {canFinish && (
          <button
            type="submit"
            name="intent"
            value="finish"
            disabled={pending}
            className="min-h-12 w-full rounded-xl border border-accent px-4 text-base font-semibold disabled:opacity-60"
          >
            모임 끝 · 평점 남기러 가기
          </button>
        )}
      </div>
    </form>
  );
}
