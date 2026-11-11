'use client';

import { useActionState } from 'react';
import { adminLogin, adminLogout, saveBook, saveMember, type FormState } from './actions';

const input = 'min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base';
const btn = 'min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60';

function Err({ id, msgs }: { id: string; msgs?: string[] }) {
  if (!msgs?.length) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-danger">
      {msgs[0]}
    </p>
  );
}

function Field({ label, name, state, children }: { label: string; name: string; state: FormState; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      <Err id={`${name}-err`} msgs={state.errors?.[name]} />
    </div>
  );
}

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="관리자 비밀번호" name="password" state={state}>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </Field>
      <button type="submit" disabled={pending} className={`${btn} w-full`}>
        {pending ? '확인 중…' : '관리 화면 열기'}
      </button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={adminLogout}>
      <button type="submit" className="min-h-11 rounded-xl border border-line px-3 text-sm">
        잠그기
      </button>
    </form>
  );
}

type MemberRow = { id: string; name: string; rotation_order: number; color: string; status: string };

/** 멤버 추가(member 없음) 또는 수정 */
export function MemberForm({ member }: { member?: MemberRow }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMember, {});
  const v = state.values ?? {};
  const init = {
    name: v.name ?? member?.name ?? '',
    rotationOrder: v.rotationOrder ?? String(member?.rotation_order ?? ''),
    color: v.color ?? member?.color ?? '#8b5e3c',
    status: v.status ?? member?.status ?? 'active',
  };
  const k = `${member?.id ?? 'new'}-${state.ok ? 'ok' : 'x'}`; // 추가 성공 뒤에는 폼을 비운다
  return (
    <form key={k} action={action} className="space-y-3" noValidate>
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="이름" name="name" state={state}>
          <input id="name" name="name" defaultValue={init.name} className={input} />
        </Field>
        <Field label="선정 순서" name="rotationOrder" state={state}>
          <input id="rotationOrder" name="rotationOrder" inputMode="numeric" defaultValue={init.rotationOrder} className={input} />
        </Field>
        <Field label="색" name="color" state={state}>
          <input id="color" name="color" defaultValue={init.color} className={input} />
        </Field>
        <Field label="상태" name="status" state={state}>
          <select id="status" name="status" defaultValue={init.status} className={input}>
            <option value="active">활동 중</option>
            <option value="pending">대기</option>
          </select>
        </Field>
      </div>
      <Err id="form-err" msgs={state.errors?.form} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btn}>
          {pending ? '저장 중…' : member ? '저장' : '멤버 추가'}
        </button>
        {state.ok && <span role="status" className="text-sm text-muted">저장했어요</span>}
      </div>
    </form>
  );
}

type BookRow = {
  id: string;
  title: string;
  authors: string[];
  translators: string[];
  publisher: string | null;
  pages: number | null;
  genre: string | null;
  description: string | null;
};

export function BookForm({ book, genres }: { book: BookRow; genres: readonly string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBook, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="id" value={book.id} />
      <Field label="제목" name="title" state={state}>
        <input id="title" name="title" defaultValue={v.title ?? book.title} className={input} />
      </Field>
      <Field label="저자 (쉼표로 구분)" name="authors" state={state}>
        <input id="authors" name="authors" defaultValue={v.authors ?? book.authors.join(', ')} className={input} />
      </Field>
      <Field label="옮긴이 (쉼표로 구분)" name="translators" state={state}>
        <input id="translators" name="translators" defaultValue={v.translators ?? book.translators.join(', ')} className={input} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="출판사" name="publisher" state={state}>
          <input id="publisher" name="publisher" defaultValue={v.publisher ?? book.publisher ?? ''} className={input} />
        </Field>
        <Field label="쪽수" name="pages" state={state}>
          <input id="pages" name="pages" inputMode="numeric" defaultValue={v.pages ?? (book.pages ?? '')} className={input} />
        </Field>
      </div>
      <Field label="장르" name="genre" state={state}>
        <select id="genre" name="genre" defaultValue={v.genre ?? book.genre ?? ''} className={input}>
          <option value="">없음</option>
          {genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </Field>
      <Field label="책 소개" name="description" state={state}>
        <textarea id="description" name="description" rows={4} defaultValue={v.description ?? book.description ?? ''} className={`${input} py-2`} />
      </Field>
      <Err id="form-err" msgs={state.errors?.form} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btn}>
          {pending ? '저장 중…' : '책 정보 저장'}
        </button>
        {state.ok && <span role="status" className="text-sm text-muted">저장했어요</span>}
      </div>
    </form>
  );
}

/** 삭제는 항상 확인 창을 거친다. */
export function DeleteButton({ action, id, what }: { action: (fd: FormData) => Promise<void>; id: string; what: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`${what}\n\n지우면 되돌릴 수 없어요. 계속할까요?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="min-h-11 rounded-xl border border-danger px-3 text-sm font-medium text-danger">
        삭제
      </button>
    </form>
  );
}
