import { describe, expect, it } from 'vitest';
import { backupFileName, expiredBackups, latestBackup, parseBackup } from './backup';

describe('backupFileName', () => {
  it('한국 날짜로 이름을 만든다', () => {
    expect(backupFileName(new Date('2026-11-16T00:00:00Z'))).toBe('2026-11-16.json');
  });
  it('한국 00시(UTC 전날 15시)에 돌면 그날(한국) 날짜가 된다', () => {
    expect(backupFileName(new Date('2026-11-15T15:00:00Z'))).toBe('2026-11-16.json');
    expect(backupFileName(new Date('2026-11-15T14:59:00Z'))).toBe('2026-11-15.json');
  });
});

describe('expiredBackups', () => {
  const now = new Date('2026-11-16T00:00:00Z');
  it('12주(84일)보다 오래된 것만 고른다', () => {
    // 84일 전 = 2026-08-24. 그보다 이전만 만료
    const names = ['2026-08-23.json', '2026-08-24.json', '2026-11-09.json', '2026-01-05.json'];
    expect(expiredBackups(names, now).sort()).toEqual(['2026-01-05.json', '2026-08-23.json']);
  });
  it('형식이 다른 파일은 지우지 않는다', () => {
    expect(expiredBackups(['notes.txt', '2020-13-99.bak', '.emptyFolderPlaceholder'], now)).toEqual([]);
  });
});

describe('latestBackup', () => {
  it('가장 최근 날짜를 고른다', () => {
    expect(latestBackup(['2026-11-02.json', '2026-11-16.json', '2026-11-09.json', 'x.txt'])).toBe('2026-11-16.json');
  });
  it('없으면 null', () => {
    expect(latestBackup([])).toBeNull();
    expect(latestBackup(['x.txt'])).toBeNull();
  });
});

describe('parseBackup', () => {
  const empty = { members: [], books: [], meetings: [], meeting_attendees: [], ratings: [], book_interests: [] };
  const required = Object.keys(empty);
  it('올바른 백업은 통과', () => {
    const b = parseBackup(JSON.stringify({ version: 1, createdAt: '2026-11-16T00:00:00Z', tables: empty }), required);
    expect(b.tables.members).toEqual([]);
  });
  it('필수 테이블을 지정하지 않으면 없는 테이블이 있어도 통과(옛 백업 복원)', () => {
    expect(() => parseBackup(JSON.stringify({ version: 1, createdAt: 'x', tables: { members: [] } }))).not.toThrow();
  });
  it('JSON이 아니거나 형식이 다르면 이유와 함께 거절', () => {
    expect(() => parseBackup('not json')).toThrow('JSON');
    expect(() => parseBackup(JSON.stringify({ version: 2, createdAt: 'x', tables: empty }), required)).toThrow('형식');
    expect(() => parseBackup(JSON.stringify({ version: 1, createdAt: 'x', tables: { ...empty, ratings: undefined } }), required)).toThrow('ratings');
  });
});

describe('parseBackup 옛 이름 변환', () => {
  const renames = { members: 'book_members', books: 'book_books' };
  const text = (tables: object) => JSON.stringify({ version: 1, createdAt: 'x', tables });
  it('옛 이름의 테이블을 새 이름으로 바꿔서 돌려준다', () => {
    const b = parseBackup(text({ members: [{ id: 1 }], books: [] }), ['book_members', 'book_books'], renames);
    expect(Object.keys(b.tables).sort()).toEqual(['book_books', 'book_members']);
    expect(b.tables.book_members).toEqual([{ id: 1 }]);
  });
  it('새 이름 백업은 그대로 통과한다', () => {
    const b = parseBackup(text({ book_members: [{ id: 2 }], book_books: [] }), ['book_members'], renames);
    expect(b.tables.book_members).toEqual([{ id: 2 }]);
  });
  it('옛 이름과 새 이름이 같이 있으면 새 이름 쪽을 쓴다', () => {
    const b = parseBackup(text({ members: [{ id: 1 }], book_members: [{ id: 2 }] }), [], renames);
    expect(b.tables.book_members).toEqual([{ id: 2 }]);
  });
  it('변환하고도 필수 테이블이 없으면 거절한다', () => {
    expect(() => parseBackup(text({ members: [] }), ['book_books'], renames)).toThrow('tables.book_books');
  });
});
