# 아직 안 한 것

끝내면 항목을 `docs/DONE.md`로 옮긴다(날짜와 함께). 아이디어·계획은 README "앞으로"에, 동작 특이사항은 `NOTES.md`에 둔다. 이 파일은 "하기로 했는데 아직 안 한 일"만 모은다.

## 확인 (코드는 끝났고 눈으로/실행으로 봐야 하는 것)
- [ ] 로그아웃 상태(시크릿 창)에서 두 사이트가 읽기 전용으로 열리는지 확인
- [ ] 워크아웃 게스트 화면: 팝업 → `/login` 링크로 바꾼 뒤 화면 재확인, 로그인 후 `?next=` 복귀 확인
- [ ] 로그인한 상태의 기존 흐름(평점, 선정, 기록 저장)이 그대로인지 확인
- [ ] iPhone 홈 화면 추가(PWA) 동작 확인

## 설정 (사용자가 직접 해야 하는 것)
- [ ] 백업 미러: 비공개 레포 만들기 → fine-grained 토큰 발급 → 시크릿 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BACKUP_REPO_TOKEN`, 변수 `BACKUP_REPO` 등록 → `backup-mirror` 수동 실행 (워크플로는 아직 한 번도 안 돌았음)
- [ ] 로컬 git 원격 주소를 `me-apps`로 변경
- [ ] workout Vercel 프로젝트 env 확인

## 정리
- [ ] `CLAUDE.md`, `docs/NOTES.md`의 `book.<도메인>` 자리표시자를 실제 주소로 바꿀지 결정
- [ ] 노션 개발자 위키의 스키마 부분이 옛 테이블 이름(book_ 접두사 전)인 것 고치기
- [ ] 노션 🏋️ DB를 계속 쓸지 결정
- [ ] `workout-log` SKILL.md(아티팩트 기준)와 작업로그를 웹앱 기준으로 갱신
- [ ] `supabase/config.toml`의 `project_id = "book-club"`: 의도적으로 남김, 바꿀지 결정

## 나중에
- [ ] 운동 세션 요약 view(`workout_session_summary`)
- [ ] Web Push 알림
- [ ] 허브 페이지(두 앱 진입점) 여부
