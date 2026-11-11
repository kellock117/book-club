import { ImageResponse } from 'next/og';

/** iOS 홈 화면 아이콘(180×180). 기본 글꼴에 한글·한자가 없어서 글자 대신 덤벨 도형을 그린다. */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c2410c' }}>
        {/* 덤벨: 가운데 막대 + 양쪽 두 겹 원판 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 18, height: 73, background: '#fff', borderRadius: 5 }} />
          <div style={{ width: 24, height: 100, background: '#fff', borderRadius: 6, marginLeft: 5 }} />
          <div style={{ width: 80, height: 20, background: '#fff', margin: '0 5px' }} />
          <div style={{ width: 24, height: 100, background: '#fff', borderRadius: 6, marginRight: 5 }} />
          <div style={{ width: 18, height: 73, background: '#fff', borderRadius: 5 }} />
        </div>
      </div>
    ),
    size,
  );
}
