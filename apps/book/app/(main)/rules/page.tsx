import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { parseMarkdown } from '@/lib/markdown';

export const metadata: Metadata = { title: '규칙 · 독서 모임' };

export default async function RulesPage() {
  let src = '# 우리의 규칙\n\n아직 규칙이 등록되지 않았어요.';
  try {
    src = await readFile(path.join(process.cwd(), 'content', 'rules.md'), 'utf8');
  } catch {
    // 파일이 없어도 페이지는 깨지지 않는다
  }
  const blocks = parseMarkdown(src);
  return (
    <article className="space-y-4 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          const cls = b.level === 1 ? 'font-serif text-2xl font-bold' : 'font-serif text-lg font-bold pt-2';
          return b.level === 1 ? <h1 key={i} className={cls}>{b.text}</h1> : <h2 key={i} className={cls}>{b.text}</h2>;
        }
        if (b.type === 'ul')
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.items.map((t, j) => (
                <li key={j}>{t}</li>
              ))}
            </ul>
          );
        if (b.type === 'quote') return <blockquote key={i} className="rounded-xl border border-line bg-surface p-3 text-sm text-muted">{b.text}</blockquote>;
        return <p key={i}>{b.text}</p>;
      })}
    </article>
  );
}
