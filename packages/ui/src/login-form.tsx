'use client';

/**
 * 비밀번호 로그인 폼. 독서 모임과 운동 등 모든 앱의 로그인 화면이 함께 쓴다.
 *
 * 폼은 화면만 맡고, 비밀번호를 확인하는 서버 액션은 앱이 넘겨 준다(`action`).
 * 액션은 `{ error?: string }`을 돌려주면 폼이 오류 문구를 보여 준다. 성공하면 액션이 직접 redirect한다.
 */
import { useActionState } from 'react';

export type LoginState = { error?: string };

type Props = {
  /** 비밀번호를 확인하는 서버 액션 (앱마다 다른 비밀번호·쿠키를 쓴다) */
  action: (prev: LoginState, formData: FormData) => Promise<LoginState>;
  /** 로그인 뒤 돌아갈 경로(주소의 ?next=). 안전 검사는 서버 액션에서 한다. */
  next?: string;
};

export function LoginForm({ action: serverAction, next }: Props) {
  const [state, action, pending] = useActionState<LoginState, FormData>(serverAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'login-error' : undefined}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base"
        />
        {state.error && (
          <p id="login-error" role="alert" className="mt-2 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? '확인 중…' : '들어가기'}
      </button>
    </form>
  );
}
