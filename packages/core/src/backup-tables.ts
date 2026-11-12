/**
 * 백업·복원 대상 테이블 표. 새 앱이 DB 테이블을 만들면 여기에 한 줄 추가한다.
 *
 * - 순서가 중요하다: 외래 키가 가리키는 쪽(부모)이 먼저 와야 복원할 때 넣을 수 있다.
 * - conflictKey: 복원(upsert)할 때 "같은 행"을 알아보는 열. 연결 테이블은 복합 키다.
 * - 이름 규칙: 앱 테이블은 `<앱>_<이름>`(book_*, workout_*). 새 앱도 같은 규칙을 따른다 (CLAUDE.md 참고).
 * - 진행 중 상태처럼 잃어도 되는 임시 테이블(workout_drafts)은 넣지 않는다.
 */
import type { TableSpec } from './backup';

/** 독서 모임(apps/book) */
export const BOOK_TABLES: readonly TableSpec[] = [
  { name: 'book_members', conflictKey: 'id' },
  { name: 'book_books', conflictKey: 'id' },
  { name: 'book_meetings', conflictKey: 'id' },
  { name: 'book_meeting_attendees', conflictKey: 'meeting_id,member_id' },
  { name: 'book_ratings', conflictKey: 'id' },
  { name: 'book_interests', conflictKey: 'book_id,member_id' },
];

/**
 * 테이블 이름에 `book_` 접두사가 붙기 전(2026-11-14 이전)에 만든 백업 파일의 옛 이름 → 새 이름.
 * 복원 스크립트가 옛 백업을 읽을 때 이름을 바꿔서 넣는다.
 */
export const LEGACY_TABLE_RENAMES: Readonly<Record<string, string>> = {
  members: 'book_members',
  books: 'book_books',
  meetings: 'book_meetings',
  meeting_attendees: 'book_meeting_attendees',
  ratings: 'book_ratings',
};

/** 운동 기록(apps/workout) */
export const WORKOUT_TABLES: readonly TableSpec[] = [
  { name: 'workout_sessions', conflictKey: 'id' },
  { name: 'workout_sets', conflictKey: 'session_id,ord,set_no' },
];

/** 크론이 매일 백업하는 전체 표. 앱을 추가하면 여기에 이어 붙인다. */
export const ALL_BACKUP_TABLES: readonly TableSpec[] = [...BOOK_TABLES, ...WORKOUT_TABLES];
