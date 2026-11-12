import Link from 'next/link';
import { initialOf } from '@/lib/guest-mask';

type Props = { id?: string; name: string; color: string; size?: 'sm' | 'md' };

/** 멤버 색 동그라미. id를 주면 프로필로 가는 링크가 된다. */
export function Avatar({ id, name, color, size = 'sm' }: Props) {
  const cls = `inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size === 'md' ? 'size-11 text-base' : 'size-7 text-xs'}`;
  const dot = (
    <span className={cls} style={{ backgroundColor: color }} aria-hidden={id ? undefined : true}>
      {initialOf(name)}
    </span>
  );
  if (!id) return dot;
  return (
    <Link href={`/members/${id}`} aria-label={`${name} 프로필`} className="inline-flex">
      {dot}
    </Link>
  );
}

/** 이름 옆에 색 점을 붙인 멤버 표시. */
export function MemberName({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
