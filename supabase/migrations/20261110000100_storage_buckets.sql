-- Storage 버킷: 표지(covers), 백업(backups)
-- covers는 공개 읽기(표지 이미지는 비밀이 아니다). 쓰기는 service role만 가능하다.
-- backups는 비공개. 정책은 만들지 않으므로 service role 외에는 접근할 수 없다.
insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('backups', 'backups', false)
on conflict (id) do nothing;
