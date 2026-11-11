import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Suspense } from 'react';
import { Toast } from '@/components/toast';
import './globals.css';

export const metadata: Metadata = {
  title: '독서 모임',
  description: '우리 독서 모임의 기록',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Suspense fallback={null}>
          <Toast />
        </Suspense>
        {/* Vercel 대시보드의 Analytics·Speed Insights를 켜 두면 배포 환경에서만 집계된다 */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
