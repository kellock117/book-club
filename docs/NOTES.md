# 특이사항 (NOTES)

발견할 때마다 바로 추가한다. 코드로 알 수 없는 것, 함정, 가정, 사용자가 해야 할 일.

## 환경·도구
- corepack이 pnpm 12를 읽지 못해(`pnpm.cjs` 없음) pnpm 10.18.3으로 고정했다. 루트 `package.json`의 `packageManager`.
- pnpm이 esbuild 빌드 스크립트를 막아서 `pnpm.onlyBuiltDependencies: ["esbuild"]`를 둔다(tsx가 필요로 함).
- `next dev`가 가끔 레포 루트에 `.next`를 만든다. 지워도 된다.
- Next 16은 `middleware.ts` 대신 `proxy.ts`를 쓴다.

## 이동·호환
- 독서 전용이던 쿠키 이름은 `apps/book/lib/auth/cookies.ts`, 토스트 문구는 `apps/book/lib/toast-messages.ts`.
- `apps/book/lib/stats.ts`가 `todayInSeoul`, `daysBetween`을 core에서 다시 내보낸다(기존 import 호환용, 나중에 정리 가능).
- 노션 스냅샷 경로는 `apps/book/scripts/fixtures/notion-snapshot.json`(개인정보, git 제외).

## 배포 (사용자가 할 일)
- 기존 Vercel 프로젝트(이름은 옛 이름 `book-club` 그대로)의 Root Directory를 `apps/book`으로 바꾼다. 바꾸기 전에 main에 머지하면 배포가 깨진다.
- `workout` 프로젝트를 새로 만든다(Root Directory `apps/workout`). env: SUPABASE_URL, SUPABASE_SECRET_KEY, WORKOUT_PASSWORD.
- 도메인: `book.<도메인>` → book, `workout.<도메인>` → workout. 기존 `*.vercel.app`은 book에 그대로 둔다.
- GitHub 시크릿: `VERCEL_PROJECT_ID_BOOK`, `VERCEL_PROJECT_ID_WORKOUT`.

## 아직 확인하지 않은 것
- 로컬 화면 확인, Tailwind가 `@me/ui` 클래스를 읽는지, 크론 백업(workout 테이블 포함 여부).

## 가정
- 도메인은 구매했다고 가정하고 코드를 짰다. 실제 도메인이 정해지면 문서의 `<도메인>`을 바꾼다.
- 운동 원본은 Supabase만. 노션 🏋️ DB는 이전 후 유지/삭제를 사용자와 정한다.

## 운동 DB
- Docker가 꺼져 있어 `db:types`로 못 만들고 `packages/core/src/database.ts`에 workout 3개 테이블을 손으로 넣었다. Docker를 켠 뒤 `pnpm --filter @me/core db:types`로 다시 만들어 차이를 확인한다.
- `workout_drafts`는 임시 저장이라 백업 표에서 뺐다. service_role 권한은 기존 default privileges가 준다.

## 운동 앱 설계 메모
- 구분 값은 DB·코드 모두 `lower`/`upper` (아티팩트의 `l`/`u`는 쓰지 않는다).
- 날짜·시각 표시는 서울(UTC+9) 고정이다. 폰 시간대가 달라도 같은 값이 나오고, 서버(UTC)에서 계산해도 같다. 새벽 5시 전 시작은 전날 (`lib/calc.ts`의 `workoutDate`, 테스트로 고정).
- 저장(`finishWorkout`)은 세션 id로 upsert + 세트를 지웠다 다시 넣는 방식이라 여러 번 눌러도 결과가 같다. 날짜는 클라이언트 값이 아니라 서버가 시작 시각에서 계산한다.
- 임시 저장은 기기(localStorage)에 즉시, 서버(`workout_drafts`)에 디바운스로 쓴다. 두 곳 중 `ts`가 더 새로운 쪽을 따른다.
- 아티팩트에 있던 "데드버그 / 플랭크(초)" 종목은 11/09에 루틴에서 뺐다. 단위 '초'는 종목 데이터의 `unit`으로 남겨 두었다.
- 근육 지도 SVG 경로(`lib/body-paths.ts`)는 아티팩트에서 스크립트로 옮긴 값이다(앞 26·뒤 20·공통 8개 일치 확인). 손으로 고치지 않는다.
- 이 앱의 `--outline`(근육 윤곽선)은 공용 테마의 `--ink`(글자색)와 이름이 겹쳐서 분리했다. 공용 `--ink`는 `--fg`를 가리킨다.
- `workout_sets`의 기본 키는 `(session_id, ord, set_no)` 복합 키다(자동 id 없음). 같은 세트를 다시 저장해도 겹치지 않고, 백업 복원 때 id 충돌·시퀀스 문제도 없다. 백업 표의 conflictKey도 같다.
- pnpm은 package.json에 선언한 패키지만 보인다. 앱에서 새 패키지를 쓰면 그 앱 package.json에 직접 추가한다(예: scripts에서 쓰는 @supabase/supabase-js).

## CI
- `.github/workflows/deploy.yml`: verify(전체 `pnpm turbo typecheck test build`) → supabase(db push) → vercel(앱 matrix). 비밀 값 없이 도는 verify는 자리표시 env로 빌드한다.
- Vercel 잡은 `turbo-ignore <앱>`으로 "그 앱 또는 의존 패키지가 바뀐 경우"만 배포한다. 수동 실행(workflow_dispatch)은 항상 배포한다. 마이그레이션(supabase/)만 바뀐 커밋은 앱을 다시 배포하지 않는다.
- 시크릿 이름이 바뀌었다: 기존 `VERCEL_PROJECT_ID` → `VERCEL_PROJECT_ID_BOOK`. 새로 `VERCEL_PROJECT_ID_WORKOUT`이 필요하다. 머지 전에 GitHub에서 추가해야 한다.
- 이 워크플로는 아직 GitHub에서 돌려 보지 않았다 (PR을 올려야 verify를 확인할 수 있고, vercel 잡은 main 머지 때만 돈다).
- `db:types`는 임시 파일(`database.ts.tmp`)에 쓴 뒤 옮긴다. 예전 방식(`> database.ts`)은 `supabase` 실행이 실패하면 파일을 빈 파일로 만들었다(이번에 실제로 겪음, git으로 복구). 생성 결과는 줄 모양이 지금 파일과 다르지만 내용은 같다. 확인: 직접 쓴 workout 3개 테이블 타입이 생성본과 열·null 여부가 모두 일치했다.
- 로컬 Supabase는 Docker Desktop을 켜야 한다 (`open -a Docker`). 이미지가 캐시돼 있으면 `supabase start`가 1분 안에 끝난다.
- `next dev`가 `AGENTS.md`를 자동 생성/재생성한다. 각 앱 next.config에 `agentRules: false`를 두어 앱 폴더에는 만들지 않게 했다. 루트 `AGENTS.md`(CLAUDE.md가 `@AGENTS.md`로 읽음)만 커밋한다.

## 로컬에서 확인한 것 (2026-11-12, 로컬 Supabase + 개발 서버)
- workout: 틀린 비밀번호 거절 → 로그인 → 하체 시작(11/09 기록에서 4·3·3·3·3세트·횟수 자동 채움) → + / ✓ / 휴식 타이머 / 순서 잠금 → 새로고침 후 이어짐 → 운동 완료 → 검토 → 저장 → DB에 세션·세트 생성, 임시 저장 삭제.
- 날짜: 새벽 00:56에 시작한 운동이 `date=2026-11-11`로 저장됨(5시 규칙).
- 앱 간 격리: workout 토큰을 `club_session`·`site_workout`로 book에 보내도, book 토큰 이름을 workout에 보내도 전부 `/login`으로 튕김.
- 근육 지도(다크·라이트 모두), 운동 가이드 시트, 건너뛰기 → 되돌리기 토스트 확인.
- 크론 `?backup=1` JSON에 `workout_sessions`·`workout_sets`가 포함됨(book 테이블과 함께 한 파일).
- 빌드: workout 번들에 recharts 없음. `pnpm turbo typecheck test build` 전부 통과(core 20·workout 16·book 101 테스트).

## 아직 확인하지 못한 것
- 실제 iPhone(Safari)에서의 동작: 화면 잠금·백그라운드 후 타이머, 1:30 삑 소리, 홈 화면 추가(PWA) 아이콘. 배포 뒤 폰에서 확인해야 한다.
- 시작 시각·끝 시각을 손으로 고치는 입력(`TimeInput`)과 횟수 입력(`RepsInput`)의 실기기 동작. 로직은 `calc.test.ts`로 고정했지만 화면 입력은 브라우저에서 눌러 보지 않았다.
- GitHub Actions(PR에서 verify, main에서 supabase·vercel).

## 개인정보
- `apps/workout/components/help-sheet.tsx`에 키·몸무게(171cm 62kg)가 들어 있다. 이 레포는 비공개로 두거나, 공개할 거면 그 문단을 빼야 한다.
- 운동 가이드 마지막 문장("지금 가지고 계신 장비가 있는지 알려주시면…")은 채팅 투의 문장이라 앱에서는 뺐다.

## 테이블 접두사와 매일 백업 (2026-11-14)
- 독서 모임 테이블에 `book_`를 붙였다: `members`→`book_members`, `books`→`book_books`, `meetings`→`book_meetings`, `meeting_attendees`→`book_meeting_attendees`, `ratings`→`book_ratings`, 뷰 `member_stats`→`book_member_stats`. `book_interests`·`book_stats`·`workout_*`는 원래 접두사가 있어 그대로다. 마이그레이션은 `20261114000000_book_prefix.sql`이고 데이터는 그대로다(이름표만 바뀜).
- `books`가 `book_books`가 된 것은 어색하지만 "예외 없음" 규칙이 더 중요하다고 정했다(접두사만 보고 앱을 가르기 위해). 규칙은 CLAUDE.md "테이블 이름".
- 이름을 바꾸지 않은 것: 외래 키·check·unique 제약의 자동 이름(`books_selected_by_fkey` 등). 앱이 이름으로 쓰지 않는다. 기본 키와 인덱스, 트리거는 바꿨다.
- 옛 백업(옛 이름)은 복원 스크립트가 `LEGACY_TABLE_RENAMES`로 새 이름으로 바꿔 넣는다(`parseBackup` 3번째 인자, 단위 테스트 있음). 새 이름과 옛 이름이 한 파일에 같이 있으면 새 이름을 쓴다.
- **배포 순서 주의**: main에 머지하면 CI가 `supabase db push`를 먼저 하고 그다음 Vercel을 배포한다. 그 사이 몇 분은 앱이 옛 이름으로 조회해 오류가 난다. 혼자 쓰는 앱이라 감수하기로 했다.
- 백업은 매주 월요일에서 **매일**로 바꿨다. `vercel.json` 크론이 `0 15 * * *`(UTC 15시 = 한국 00시)다. Vercel Hobby 크론은 지정한 시 안의 아무 때나 실행되어 00:00~00:59 사이에 돈다(정확히 00:00:00이 아니다). 파일 이름은 한국 날짜이고, 같은 날 다시 불러도 그날 파일을 덮어쓴다. `?backup=1`은 이제 필요 없다(항상 백업한다).
- 보관은 12주 그대로라 최대 약 84개 파일이다. 줄이려면 `BACKUP_KEEP_WEEKS`만 바꾸면 된다.
- 검증: 로컬 DB 리셋으로 마이그레이션 적용, `database.ts` 재생성(`pnpm --filter @me/core db:types` 뒤 `npx oxfmt`로 포맷), `pnpm turbo typecheck test build` 통과. **옛 이름 백업을 실제 DB에 복원해 보는 점검은 하지 못했다**(`parseBackup` 단위 테스트로만 확인).

## 백업 사본(비공개 GitHub 저장소) (2026-11-14)
- `exportAll`이 1000행 제한 없이 페이지 단위(1000행씩, 기본 키 정렬)로 끝까지 읽는다. 안전장치는 테이블당 10만 행.
- `.github/workflows/backup-mirror.yml`: 매일 한국 01시에 Storage의 최신 백업을 별도 **비공개** 저장소에 커밋한다. 최신 백업이 36시간보다 오래되면 실패해서 메일이 온다(크론 실패 알림 대용).
- **이 저장소는 공개**라서 백업을 여기나 아티팩트로 남기면 안 된다(누구나 받을 수 있음).
- 설정(사용자가 직접): 비공개 저장소 만들기 → 그 저장소 하나에만 Contents 쓰기 권한을 준 fine-grained 토큰 → 이 저장소 Actions에 secrets `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BACKUP_REPO_TOKEN`, variable `BACKUP_REPO`(예: `<계정>/me-apps-backups`).
- 공개 저장소의 Actions 로그는 누구나 읽는다. 워크플로가 키를 출력하지 않게 `set -x`·`echo` 금지.

