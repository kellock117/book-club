import type { MetadataRoute } from 'next';

/** 홈 화면에 추가(PWA)할 때 쓰는 정보. 주소는 /manifest.webmanifest 로 자동 제공된다. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '운동',
    short_name: '운동',
    description: '운동 기록과 근육 지도',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f5f2',
    theme_color: '#c2410c',
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  };
}
