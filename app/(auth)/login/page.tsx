import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: '로그인 · 독서 모임', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="mb-2 font-serif text-3xl font-bold">독서 모임</h1>
      <p className="mb-8 text-muted">우리 모임 비밀번호를 입력해 주세요.</p>
      <LoginForm next={next} />
    </>
  );
}
