import type { Metadata } from 'next';
import { RecommendForm } from './recommend-form';

export const metadata: Metadata = { title: '책 추천하기 · 독서 모임' };

export default function NewWishlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">책 추천하기</h1>
        <p className="mt-1 text-muted">검색해서 고르거나 직접 입력해 위시리스트에 올려요.</p>
      </div>
      <RecommendForm />
    </div>
  );
}
