/** 규칙 페이지용 아주 작은 마크다운 해석: 제목(#,##,###), 목록(-), 인용(>), 문단만 다룬다. */
export type Block =
  | { type: 'h'; level: 1 | 2 | 3; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'p'; text: string };

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  for (const raw of src.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (!line) flush();
    else if (h) {
      flush();
      blocks.push({ type: 'h', level: h[1]!.length as 1 | 2 | 3, text: h[2]! });
    } else if (line.startsWith('- ')) {
      flush();
      const last = blocks.at(-1);
      if (last?.type === 'ul') last.items.push(line.slice(2));
      else blocks.push({ type: 'ul', items: [line.slice(2)] });
    } else if (line.startsWith('> ')) {
      flush();
      blocks.push({ type: 'quote', text: line.slice(2) });
    } else para.push(line);
  }
  flush();
  return blocks;
}
