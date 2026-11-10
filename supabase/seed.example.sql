-- 로컬 개발용 예시. 복사해서 supabase/seed.sql로 쓰고 이름·순서·색을 바꾼다.
-- (supabase/seed.sql은 실명이 들어가므로 .gitignore에 있다.)
insert into members (name, rotation_order, status, color) values
  ('멤버1', 1, 'active', '#C2410C'),
  ('멤버2', 2, 'active', '#0891B2'),
  ('멤버3', 3, 'active', '#7C3AED')
on conflict do nothing;
