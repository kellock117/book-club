import { describe, expect, it } from 'vitest';
import { parseMarkdown } from './markdown';

describe('parseMarkdown', () => {
  it('제목·목록·인용·문단을 나눈다', () => {
    const b = parseMarkdown('# 제목\n\n> 안내\n\n본문 한 줄\n이어지는 줄\n\n## 소제목\n- 하나\n- 둘\n');
    expect(b).toEqual([
      { type: 'h', level: 1, text: '제목' },
      { type: 'quote', text: '안내' },
      { type: 'p', text: '본문 한 줄 이어지는 줄' },
      { type: 'h', level: 2, text: '소제목' },
      { type: 'ul', items: ['하나', '둘'] },
    ]);
  });
  it('빈 문자열은 빈 배열', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});
