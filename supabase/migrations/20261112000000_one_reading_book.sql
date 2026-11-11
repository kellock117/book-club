-- "읽는 중" 책은 한 번에 한 권만. 두 사람이 동시에 이번 달 책을 정해도 한쪽만 성공하도록 DB가 막는다.
create unique index books_one_reading_idx on books ((true)) where status = 'reading';
