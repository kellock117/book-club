import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 위조 쿠키 방어 테스트.
 * club_member 쿠키는 멤버 id만 알면 누구나 만들 수 있다. 사이트 로그인(서명 쿠키)이 없는 사람이
 * 그 쿠키만으로 쓰기 액션을 통과하면 안 된다 → getCurrentMember()가 null이어야 한다.
 */
let cookieJar: Record<string, string> = {};
let loggedIn = false;

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name in cookieJar ? { value: cookieJar[name] } : undefined) }),
}));
vi.mock('./access', () => ({ isLoggedIn: async () => loggedIn }));
vi.mock('@/lib/data', () => ({
  getClubData: async () => ({ members: [{ id: 'm1', status: 'active' }, { id: 'm2', status: 'inactive' }] }),
}));

import { getCurrentMember } from './member';
import { MEMBER_COOKIE } from './cookies';

describe('getCurrentMember', () => {
  beforeEach(() => {
    cookieJar = {};
    loggedIn = false;
  });

  it('로그인 없이 club_member만 위조하면 null', async () => {
    cookieJar[MEMBER_COOKIE] = 'm1';
    expect(await getCurrentMember()).toBeNull();
  });

  it('로그인했어도 쿠키가 없으면 null', async () => {
    loggedIn = true;
    expect(await getCurrentMember()).toBeNull();
  });

  it('로그인했어도 활동 중이 아닌 멤버나 없는 id면 null', async () => {
    loggedIn = true;
    cookieJar[MEMBER_COOKIE] = 'm2';
    expect(await getCurrentMember()).toBeNull();
    cookieJar[MEMBER_COOKIE] = 'nope';
    expect(await getCurrentMember()).toBeNull();
  });

  it('로그인 + 활동 중인 멤버 쿠키면 그 멤버', async () => {
    loggedIn = true;
    cookieJar[MEMBER_COOKIE] = 'm1';
    expect((await getCurrentMember())?.id).toBe('m1');
  });
});
