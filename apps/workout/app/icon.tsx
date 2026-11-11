import { ImageResponse } from 'next/og';

/** 앱 아이콘(512×512). 그림 파일 없이 코드로 만든다. 기본 글꼴에 한글·한자가 없어서 글자 대신 덤벨 도형을 그린다. */
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c2410c' }}>
        {/* 덤벨: 가운데 막대 + 양쪽 두 겹 원판 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 53, height: 209, background: '#fff', borderRadius: 15 }} />
          <div style={{ width: 68, height: 285, background: '#fff', borderRadius: 19, marginLeft: 15 }} />
          <div style={{ width: 228, height: 57, background: '#fff', margin: '0 15px' }} />
          <div style={{ width: 68, height: 285, background: '#fff', borderRadius: 19, marginRight: 15 }} />
          <div style={{ width: 53, height: 209, background: '#fff', borderRadius: 15 }} />
        </div>
      </div>
    ),
    size,
  );
}
