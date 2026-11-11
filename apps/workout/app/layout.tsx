import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '운동',
  description: '운동 기록과 근육 지도',
  robots: { index: false, follow: false },
  // 홈 화면에 추가했을 때 주소창 없는 앱처럼 열리게 (iOS)
  appleWebApp: { capable: true, title: '운동', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // 노치 영역까지 쓰고, 안쪽 여백은 workout.css가 safe-area로 맞춘다
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
