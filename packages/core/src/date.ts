/**
 * 날짜 계산. 날짜는 모두 'YYYY-MM-DD' 문자열(한국 날짜)로 다룬다.
 * 시간대 때문에 하루가 밀리지 않게 `Date.UTC`로 일수만 센다.
 */

/** 주어진 시각의 한국(Asia/Seoul) 날짜. "오늘"은 호출하는 쪽이 이 함수로 만들어 넘기면 테스트하기 쉽다. */
export function todayInSeoul(now: Date): string {
  // en-CA 로케일은 YYYY-MM-DD 형식으로 나온다
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** 'YYYY-MM-DD'를 숫자로 쪼갠다. 형식이 다르면 예외. */
export function parseYmd(s: string): { y: number; m: number; d: number } {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`날짜 형식이 YYYY-MM-DD가 아님: ${s}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function dayNumber(s: string): number {
  const { y, m, d } = parseYmd(s);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** to - from 일수 (to가 뒤면 양수). */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}
