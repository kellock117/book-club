import { coverUrl } from '@/lib/format';

// 장르별 단색 표지. 장르가 없으면 제목으로 정한다. 글자는 모두 흰색이라 대비 4.5:1 이상인 짙은 색만 쓴다.
const COVER_COLORS = ['#7a4b2a', '#8a3b2e', '#2f5d50', '#3f4c78', '#6b3f69', '#4a5a2a', '#6a4a1f'];

function pick(key: string): string {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_COLORS[h % COVER_COLORS.length]!;
}

type Props = {
  title: string;
  authors?: string[];
  genre?: string | null;
  coverPath?: string | null;
  className?: string;
};

/** 책 표지 (2:3). 이미지가 없으면 제목과 저자를 넣은 단색 표지를 그린다. */
export function Cover({ title, authors = [], genre, coverPath, className = '' }: Props) {
  const url = coverUrl(coverPath);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`${title} 표지`} loading="lazy" className={`aspect-[2/3] w-full rounded-md object-cover shadow-sm ${className}`} />;
  }
  return (
    <div
      role="img"
      aria-label={`${title} 표지`}
      className={`flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-md p-2.5 text-white shadow-sm ${className}`}
      style={{ backgroundColor: pick(genre || title) }}
    >
      <span className="line-clamp-4 font-serif text-sm font-bold leading-snug">{title}</span>
      <span className="line-clamp-2 text-[11px] opacity-90">{authors.join(', ')}</span>
    </div>
  );
}
