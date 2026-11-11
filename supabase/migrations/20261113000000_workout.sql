-- 운동 기록 앱(apps/workout)의 테이블.
-- 서버(secret 키)로만 접근하므로 RLS는 켜고 정책은 두지 않는다. 합계·휴식은 저장하지 않고 계산한다.

-- 운동 한 번 (상체/하체 등). id는 화면에서 만든 문자열(s_<시각>)이라 다시 저장해도 같은 줄에 덮어쓴다.
create table workout_sessions (
  id          text primary key,
  part        text not null,                 -- 'upper' | 'lower'
  date        date not null,                 -- 새벽 5시 전 시작은 전날
  started_at  timestamptz,
  ended_at    timestamptz,
  finished    boolean not null default false, -- false면 중간에 끝낸 운동
  memo        text,
  created_at  timestamptz not null default now()
);
create index workout_sessions_part_date_idx on workout_sessions (part, date desc);

-- 세트 한 줄. 휴식 = 이전 세트 ended_at ~ 이번 세트 started_at.
-- 기본 키는 (세션, 종목 순서, 세트 번호)라서 같은 세트를 다시 저장해도 겹치지 않고, 백업 복원도 그대로 들어간다.
create table workout_sets (
  session_id  text not null references workout_sessions (id) on delete cascade,
  exercise    text not null,
  ord         int  not null,                 -- 운동 순서
  set_no      int  not null,                 -- 그 종목에서 끝낸 세트의 번호
  reps        int,
  unit        text not null default '회',    -- '회' | '초' 등
  started_at  timestamptz,
  ended_at    timestamptz,
  extra       jsonb,                          -- 무게 등 나중에 늘릴 값
  edited      boolean not null default false, -- 시각을 손으로 고친 세트
  primary key (session_id, ord, set_no)
);

-- 진행 중인 운동 임시 저장(기기를 바꿔도 이어서). 한 줄(id='current')만 쓴다. 백업 대상 아님.
create table workout_drafts (
  id          text primary key,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table workout_sessions enable row level security;
alter table workout_sets     enable row level security;
alter table workout_drafts   enable row level security;

-- service_role 권한은 20261111000000_grant_service_role.sql의 default privileges가 자동으로 준다.
