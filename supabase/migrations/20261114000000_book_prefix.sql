-- 테이블 이름 규칙: 앱 테이블은 `<앱>_<이름>` 으로 짓는다 (독서 모임 = book_, 운동 = workout_).
-- Supabase 대시보드는 한 DB의 테이블을 이름순으로 한 줄에 보여주므로, 접두사만 봐도 어느 앱 것인지 알 수 있게 하기 위해서다.
-- 이 마이그레이션은 독서 모임 테이블에 `book_` 를 붙인다 (운동은 처음부터 workout_ 이라 그대로).
--
-- 데이터는 그대로다. `rename`은 이름표만 바꾸므로 외래 키, RLS, 권한, 뷰, 트리거가 자동으로 따라온다
-- (Postgres는 이름이 아니라 내부 번호(OID)로 연결하기 때문).
-- 아래에서는 사람이 보기 위한 이름(인덱스, 기본 키, 트리거, 뷰)도 같은 규칙으로 맞춘다.
-- 이름이 `<테이블>_<열>_fkey` 꼴인 외래 키·check 제약은 앱이 이름으로 쓰지 않아 그대로 둔다.
--
-- 옛 백업 파일(옛 이름 members, books …)은 복원 스크립트가 새 이름으로 바꿔서 넣는다
-- (packages/core/src/backup-tables.ts 의 LEGACY_TABLE_RENAMES).

-- ───────────── 테이블 ─────────────
alter table members           rename to book_members;
alter table books             rename to book_books;     -- 책(책 한 권의 정보)
alter table meetings          rename to book_meetings;
alter table meeting_attendees rename to book_meeting_attendees;
alter table ratings           rename to book_ratings;
-- book_interests 는 처음부터 book_ 로 시작해서 그대로 둔다.

-- ───────────── 기본 키 (이름을 바꾸면 딸린 인덱스 이름도 같이 바뀐다) ─────────────
alter table book_members           rename constraint members_pkey           to book_members_pkey;
alter table book_books             rename constraint books_pkey             to book_books_pkey;
alter table book_meetings          rename constraint meetings_pkey          to book_meetings_pkey;
alter table book_meeting_attendees rename constraint meeting_attendees_pkey to book_meeting_attendees_pkey;
alter table book_ratings           rename constraint ratings_pkey           to book_ratings_pkey;

-- ───────────── 인덱스 ─────────────
alter index books_status_idx             rename to book_books_status_idx;
alter index books_selected_by_idx        rename to book_books_selected_by_idx;
alter index books_one_reading_idx        rename to book_books_one_reading_idx;
alter index meetings_book_id_idx         rename to book_meetings_book_id_idx;
alter index meeting_attendees_member_idx rename to book_meeting_attendees_member_idx;
alter index ratings_member_idx           rename to book_ratings_member_idx;

-- ───────────── 트리거 ─────────────
alter trigger ratings_set_updated_at on book_ratings rename to book_ratings_set_updated_at;

-- ───────────── 뷰 ─────────────
-- book_stats 는 이미 book_ 로 시작하므로 그대로 둔다.
alter view member_stats rename to book_member_stats;

-- ───────────── 설명 (대시보드 Table Editor에 보인다) ─────────────
comment on table book_members           is '[독서] 모임 멤버. rotation_order = 책 선정 순서';
comment on table book_books             is '[독서] 책. status = wishlist(읽고 싶은) / reading(읽는 중, 한 권만) / done(읽음)';
comment on table book_interests         is '[독서] "나도 읽고 싶어요" 표시 (책 × 멤버)';
comment on table book_meetings          is '[독서] 모임 회차. 한 회차에 책 한 권';
comment on table book_meeting_attendees is '[독서] 모임 참석자 (모임 × 멤버)';
comment on table book_ratings           is '[독서] 평점·한 줄 평 (책 × 멤버, 한 사람이 한 책에 하나)';
comment on view  book_stats             is '[독서] 책별 평점 집계 (참여 수, 평균, 표준편차). 읽기 전용 뷰';
comment on view  book_member_stats      is '[독서] 멤버별 집계 (선정 수, 참석 수, 평균 점수). 읽기 전용 뷰';
comment on table workout_sessions       is '[운동] 운동 한 번 (상체/하체). 끝나야 저장된다';
comment on table workout_sets           is '[운동] 세트 한 줄. 휴식 = 이전 세트 끝 ~ 이번 세트 시작';
comment on table workout_drafts         is '[운동] 진행 중인 운동의 임시 저장 (백업 대상 아님)';
