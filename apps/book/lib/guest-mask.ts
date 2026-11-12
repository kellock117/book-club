/**
 * 게스트에게 보여 줄 데이터에서 멤버 실명을 가린다("멤버 A", "멤버 B" …).
 *
 * 레포가 공개이고 사이트도 읽기 전용으로 열려 있어서, 로그인하지 않은 사람에게는 이름이 보이면 안 된다.
 * - 멤버 이름 칸뿐 아니라 한 줄 평·추천 이유 같은 자유 글 속의 이름도 바꾼다
 *   (데이터를 통째로 문자열로 바꾼 뒤 이름을 치환하고 다시 읽는다. 어느 화면이든 같은 데이터를 쓰므로 한 곳에서 막힌다).
 * - 전체 이름(예: 홍길동)을 먼저, 그다음 성을 뗀 이름(길동)을 바꾼다. 성 뗀 이름이 다른 낱말과 겹치면 그 낱말도 바뀔 수 있다(드문 경우로 받아들였다).
 * - 알파벳은 rotation_order 순서라 로그인 화면과 상관없이 늘 같은 사람이 같은 글자를 받는다.
 */

type Named = { name: string; rotation_order: number };

/** 순서(0부터)로 이름표를 만든다: 0 → "멤버 A", 26 → "멤버 27" */
export function guestAlias(index: number): string {
  return `멤버 ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
}

/** 이름표에서 아바타에 쓸 한 글자를 뽑는다. "멤버 A" → "A", 그 밖에는 첫 글자. */
export function initialOf(name: string): string {
  const m = /^멤버 (.+)$/.exec(name);
  return m ? m[1]! : name.slice(0, 1);
}

export function maskClubData<T extends { members: Named[] }>(data: T): T {
  const ordered = [...data.members].sort((a, b) => a.rotation_order - b.rotation_order);
  const full = ordered.map((m, i) => [m.name, guestAlias(i)] as const);
  // 성 뗀 이름은 2글자 이상일 때만 (한 글자는 일반 낱말과 너무 자주 겹친다)
  const given = ordered.flatMap((m, i) => (m.name.length >= 3 ? ([[m.name.slice(1), guestAlias(i)]] as const) : []));
  let text = JSON.stringify(data);
  for (const [from, to] of [...full, ...given].sort((a, b) => b[0].length - a[0].length)) {
    if (from) text = text.split(from).join(to);
  }
  return JSON.parse(text) as T;
}
