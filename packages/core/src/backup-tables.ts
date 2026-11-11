/**
 * 백업·복원 대상 테이블 표. 새 앱이 DB 테이블을 만들면 여기에 한 줄 추가한다.
 *
 * - 순서가 중요하다: 외래 키가 가리키는 쪽(부모)이 먼저 와야 복원할 때 넣을 수 있다.
 * - conflictKey: 복원(upsert)할 때 "같은 행"을 알아보는 열. 연결 테이블은 복합 키다.
 * - 진행 중 상태처럼 잃어도 되는 임시 테이블(workout_drafts)은 넣지 않는다.
 */
import type { TableSpec } from './backup';

/** 독서 모임(apps/book) */
export const BOOK_TABLES: readonly TableSpec[] = [
  { name: 'members', conflictKey: 'id' },
  { name: 'books', conflictKey: 'id' },
  { name: 'meetings', conflictKey: 'id' },
  { name: 'meeting_attendees', conflictKey: 'meeting_id,member_id' },
  { name: 'ratings', conflictKey: 'id' },
  { name: 'book_interests', conflictKey: 'book_id,member_id' },
];

/** 운동 기록(apps/workout) */
export const WORKOUT_TABLES: readonly TableSpec[] = [
  { name: 'workout_sessions', conflictKey: 'id' },
  { name: 'workout_sets', conflictKey: 'session_id,ord,set_no' },
];

/** 크론이 매주 백업하는 전체 표. 앱을 추가하면 여기에 이어 붙인다. */
export const ALL_BACKUP_TABLES: readonly TableSpec[] = [...BOOK_TABLES, ...WORKOUT_TABLES];
