import type { Metadata } from 'next';
import { LoginForm } from '@me/ui/login-form';
import { login } from './actions';

export const metadata: Metadata = { title: '로그인 · 운동', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">운동</h1>
      <p className="mb-8 text-muted">비밀번호를 입력해 주세요.</p>
      <LoginForm action={login} next={next} />
    </main>
  );
}
