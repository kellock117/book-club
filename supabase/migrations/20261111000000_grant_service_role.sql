-- 새 Supabase 프로젝트는 public 스키마의 새 테이블을 Data API 역할에 자동으로 열어 주지 않는다
-- (테이블 권한이 없으면 "permission denied for table"). 우리 앱은 서버에서 secret 키(service_role)로만
-- 접근하므로 service_role에만 권한을 준다. anon/authenticated에는 주지 않고(init에서 회수), 정책도 만들지 않는다.
-- service_role은 BYPASSRLS라서 RLS가 켜져 있어도 이 권한만 있으면 읽고 쓸 수 있다.

grant usage on schema public to service_role;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- 이후 마이그레이션에서 만드는 객체도 같은 권한을 갖게 한다
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
