import { describe, expect, it } from 'vitest';
import { isAllowedCoverUrl } from './cover';

describe('isAllowedCoverUrl', () => {
  it('카카오·다음 이미지 서버의 https만 허용', () => {
    expect(isAllowedCoverUrl('https://t1.daumcdn.net/lbook/image/540810?timestamp=1')).toBe(true);
    expect(isAllowedCoverUrl('https://search1.kakaocdn.net/thumb/a.jpg')).toBe(true);
  });
  it('http, 다른 호스트, 비슷한 이름, 포트·계정 정보는 거절', () => {
    expect(isAllowedCoverUrl('http://t1.daumcdn.net/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('https://evil.com/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('https://daumcdn.net.evil.com/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('https://evildaumcdn.net/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('https://t1.daumcdn.net:8080/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('https://user@t1.daumcdn.net/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('http://127.0.0.1/a.jpg')).toBe(false);
    expect(isAllowedCoverUrl('not a url')).toBe(false);
  });
});
