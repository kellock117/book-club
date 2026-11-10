-- 독서 모임 웹사이트: 1단계 DB
-- 테이블 6개, 뷰 2개, RLS(정책 없음), updated_at 트리거

-- ───────────── 테이블 ─────────────

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rotation_order int not null,             -- 책 선정 순서
  status text not null default 'active' check (status in ('active','pending')),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),  -- 차트·아바타 색 (#hex)
  created_at timestamptz not null default now()
);

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[] not null default '{}',
  translators text[] not null default '{}',
  publisher text,
  published_date date,
  isbn13 text unique,
  pages int check (pages > 0),
  cover_path text,                         -- Storage covers 버킷 경로
  description text,
  source_category text,                    -- 알라딘 categoryName 원문
  genre text check (genre in ('소설','고전','철학/인문','정치/사회','에세이','과학','경제/경영','자기계발')),
  status text not null default 'wishlist' check (status in ('wishlist','reading','done')),
  selected_by uuid references members(id),
  selection_reason text,
  recommended_by uuid references members(id),
  recommend_reason text,
  info_source text check (info_source in ('aladin','kakao','manual')),
  created_at timestamptz not null default now()
);

create table book_interests (              -- "나도 읽고 싶어요"
  book_id uuid references books(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (book_id, member_id)
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,              -- 회차
  date date not null,
  book_id uuid references books(id),
  place text,
  questions text,                          -- 발제 질문
  created_at timestamptz not null default now()
);

create table meeting_attendees (
  meeting_id uuid references meetings(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (meeting_id, member_id)
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  score numeric(2,1) not null check (score between 0.5 and 5 and score * 2 = floor(score * 2)),
  one_liner text check (char_length(one_liner) <= 80),
  quote text,                              -- 인상 깊은 문장
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, member_id)
);

-- 외래 키 조회용 인덱스 (PK·unique가 이미 덮는 열은 제외)
create index books_status_idx on books (status);
create index books_selected_by_idx on books (selected_by);
create index meetings_book_id_idx on meetings (book_id);
create index meeting_attendees_member_idx on meeting_attendees (member_id);
create index book_interests_member_idx on book_interests (member_id);
create index ratings_member_idx on ratings (member_id);

-- ───────────── updated_at 트리거 ─────────────

create function set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ratings_set_updated_at
  before update on ratings
  for each row execute function set_updated_at();

-- ───────────── 집계 뷰 ─────────────
-- 뷰는 기본적으로 소유자 권한으로 실행되어 RLS를 우회하므로 security_invoker를 켠다.

create view book_stats with (security_invoker = true) as
select
  b.id as book_id,
  count(r.id)::int as rating_count,
  round(avg(r.score), 2) as avg_score,
  -- 모집단 표준편차. 평가 2개 미만이면 의견 차이를 말할 수 없으므로 null
  case when count(r.id) >= 2 then round(stddev_pop(r.score), 3) end as stddev_score
from books b
left join ratings r on r.book_id = b.id
group by b.id;

create view member_stats with (security_invoker = true) as
select
  m.id as member_id,
  (select count(*) from books b where b.selected_by = m.id)::int as selected_count,
  (select count(*) from meeting_attendees a where a.member_id = m.id)::int as attended_count,
  (select round(avg(r.score), 2) from ratings r where r.member_id = m.id) as avg_score
from members m;

-- ───────────── RLS: 켜고 정책은 만들지 않는다 ─────────────
-- 접근은 서버의 service role 키로만 한다 (service role은 RLS를 우회).

alter table members           enable row level security;
alter table books             enable row level security;
alter table book_interests    enable row level security;
alter table meetings          enable row level security;
alter table meeting_attendees enable row level security;
alter table ratings           enable row level security;

-- anon/authenticated 역할의 직접 권한도 모두 회수한다 (이중 잠금).
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
