import { describe, expect, it } from 'vitest';
import { backupFileName, expiredBackups, isMonday, latestBackup, parseBackup } from './backup';

describe('backupFileName / isMonday', () => {
  it('UTC 날짜로 이름을 만든다', () => {
    expect(backupFileName(new Date('2026-11-16T00:00:00Z'))).toBe('2026-11-16.json');
  });
  it('2026-11-16은 월요일, 11-17은 아니다', () => {
    expect(isMonday(new Date('2026-11-16T00:00:00Z'))).toBe(true);
    expect(isMonday(new Date('2026-11-17T00:00:00Z'))).toBe(false);
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
