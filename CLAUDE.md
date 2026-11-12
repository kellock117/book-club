# me-apps — 개인 앱 모노레포 규칙

> 이 파일은 규칙이 생길 때마다 바로 추가한다. 특이사항·함정은 `docs/NOTES.md`에 쓴다.
> Next 16은 기존 지식과 다르다. 코드를 쓰기 전에 `@AGENTS.md`를 읽는다.

@AGENTS.md

## 구조
- `apps/book` 독서 모임 (`book.<도메인>`), `apps/workout` 운동 기록 (`workout.<도메인>`).
- `packages/core` (`@me/core`) 서버 쪽 공용: 인증·잠금, 날짜, 백업, Supabase 클라이언트, DB 타입.
- `packages/ui` (`@me/ui`) 화면 공용: Section/Card, Toast, LoginForm, theme.css.
- `packages/config` (`@me/config`) tsconfig 기본값.
- `supabase/` DB 하나, 마이그레이션은 모든 앱이 함께 쓴다.
- 앱 하나 = Next 앱 하나 = Vercel 프로젝트 하나. 앱끼리 서로 import하지 않는다.

## 패키지 경계
- 두 앱 이상이 쓰거나 쓸 게 확실하면 packages로, 아니면 앱 안에 둔다.
- 앱 이름·문구·색 같은 앱 고유 값은 공용 패키지에 박지 않고 props나 앱 쪽 파일로 받는다.
- 패키지는 빌드하지 않고 TS 소스를 그대로 쓴다. 앱 `next.config.ts`에 `transpilePackages: ['@me/core','@me/ui']`.
- 앱 CSS에 `@import '@me/ui/theme.css'`와 `@source`로 ui 폴더를 가리킨다(Tailwind 4).

## Supabase
- 호출은 서버에서만 한다. `@me/core/server/supabase`의 secret 키 admin 클라이언트를 쓴다.
- `NEXT_PUBLIC_` 변수는 만들지 않는다. RLS는 켜고 정책은 두지 않는다.
- 읽기는 서버 컴포넌트, 쓰기는 서버 액션 + zod.
- DB 타입은 `packages/core/src/database.ts`. 마이그레이션을 바꾸면 `pnpm --filter @me/core db:types`로 다시 만든다.

## 앱별 잠금
- 앱마다 비밀번호·쿠키가 따로다(`site_<appId>`, host-only). 서명 키는 `site:<appId>:<password>`.
- `requireSite()`를 레이아웃과 모든 서버 액션에서 부른다. 로그인 액션에는 rate-limit을 건다.

## 테이블 이름
- 앱 테이블은 `<앱>_<이름>`으로 짓는다: 독서 = `book_*`, 운동 = `workout_*`, 새 앱 `money` = `money_*`. 뷰와 인덱스·기본 키·트리거도 같은 접두사를 단다.
- 이유: DB 하나를 여러 앱이 나눠 쓰고, Supabase 대시보드는 테이블을 이름순으로 한 줄에 보여준다. 접두사만 봐도 어느 앱 것인지 알 수 있어야 한다.
- 예외 없음. 이름이 겹쳐 보여도(`book_books`) 규칙을 지킨다.
- 새 테이블 마이그레이션에는 `comment on table <이름> is '[앱] 설명'`을 단다(대시보드에 보인다). `database.ts`는 마이그레이션 뒤에 다시 만든다.
- 테이블 이름을 바꾸면 백업 표의 `LEGACY_TABLE_RENAMES`에 옛 이름 → 새 이름을 더해 옛 백업도 복원되게 한다.

## 백업
- 앱이 테이블을 새로 만들면 `packages/core/src/backup-tables.ts`에 등록한다. 일시 데이터(draft 등)는 뺀다.
- 크론이 매일 한국 시간 00시(`0 15 * * *` = UTC 15시)에 전 앱 테이블을 JSON 하나(`YYYY-MM-DD.json`, 한국 날짜)로 `backups` 버킷에 저장하고 12주 지난 파일을 지운다. 복원은 `pnpm --filter book restore -- <파일>`.

## 코드·주석
- 주석과 문서는 한국어. 사람이 읽을 파일(공용 패키지, 설정, 스크립트)은 머리 주석에 역할·쓰는 곳·주의를 적고, 공개 함수에는 JSDoc을 단다.
- 날짜는 Asia/Seoul. 새벽 5시 전 시작은 전날로 센다.

## 검증
- 커밋 전 `pnpm turbo typecheck test build`가 통과해야 한다.
- 패키지 매니저는 pnpm 10.18.3(corepack). npm/yarn을 쓰지 않는다.
- 커밋·PR은 사용자 확인 후에만. push는 시키기 전에는 하지 않는다.

## 앱 폴더 규칙 (apps/<앱>)
- `app/` 라우트, `components/` 이 앱 전용 컴포넌트, `lib/` 순수 로직·데이터 접근(테스트 대상), `scripts/` 일회성 도구.
- 잠금 설정은 `lib/site.ts`(APP_ID, PASSWORD_ENV) 한 곳에 두고 proxy·로그인·서버 액션이 같이 쓴다.
- `proxy.ts` matcher는 로그인·정적 파일·PWA 파일만 빼고 전부 잠근다.

## 일회성 스크립트
- `apps/<앱>/scripts/`에 두고 `package.json`에 `tsx --env-file=.env.local …` 스크립트로 등록한다. 다시 실행해도 같은 결과(멱등)여야 한다.
- 개인정보가 든 입력 파일은 `.gitignore`에 넣는다. 레포에 올려도 되는 작은 픽스처만 `scripts/fixtures/`에 둔다.

## 읽기 전용 공개(게스트 모드)
- 로그인 안 한 사람(게스트)에게는 읽는 화면만 열어 준다. 스위치(환경 변수)는 없고 항상 이렇게 동작한다.
- 로그인은 화면 우측 상단 "로그인" 버튼(`@me/ui/guest-login`) → 따로 있는 `/login` 화면에서 비밀번호만 치면 된다. 맞으면 보던 화면으로 돌아온다(`?next=`).
- 게스트가 볼 화면은 각 앱 `proxy.ts`의 허용 목록으로 정한다(book은 `GUEST_PAGES`, workout은 `/`만). 그 밖의 주소는 로그인으로 보낸다. 새 읽기 화면을 만들면 거기에 넣어야 게스트에게 보인다. 기본은 잠김이다.
- **쓰기는 서버 액션 안에서 막는다.** proxy(라우터)의 허용 목록만으로는 부족하다. 서버 액션은 어느 주소로든 호출될 수 있고, 게스트가 열어 둔 화면 주소로도 보낼 수 있어서다. 모든 쓰기 액션은 로그인을 다시 확인한다(book은 `getCurrentMember()`가 세션 쿠키도 검사해 게스트면 null, workout은 `requireSite()`). 새 쓰기 액션이나 쓰기 API 라우트를 만들면 이 확인을 첫 줄에 넣는다. 화면 버튼을 숨기는 것은 편의일 뿐이다.
- 게스트에게는 멤버 실명을 가린다("멤버 A", "멤버 B" …, `rotation_order` 순). 모든 화면이 `getClubData()`를 거치므로 거기서 한 번에 가린다(`apps/book/lib/guest-mask.ts`). 자유 글(한 줄 평 등) 속 이름도 치환한다. 새 데이터 읽기 경로를 `getClubData()` 밖에 만들면 이름이 샐 수 있으니 만들지 않는다. 파일로 된 글(`apps/book/content/*.md`)은 가릴 수 없으므로 실명을 쓰지 않는다.
- 게스트가 못 하는 것: 평점·추천·선정·모임 수정, 책 검색 API, 관리자 화면·백업 내려받기, workout의 기록 화면(근육 지도만 보인다).

## README와 앞으로 할 일
- 루트 `README.md`는 남에게 보여 주는 소개서다(무엇을 만들었고, 어떤 기술·AI 활용을 했는지). 사용법·배포 절차는 넣지 않는다(그건 `docs/`).
- 앱이나 기능을 새로 만들 계획·아이디어가 생기면 그 자리에서 README의 "앞으로" 목록에 적는다. 만들고 나면 "앱" 섹션으로 옮긴다.
- 레포가 공개라서 실명·비밀번호·키·개인 기록은 README와 문서에 쓰지 않는다. 멤버는 "멤버 A"처럼 가린다.

## 명령
- 개발 서버: `pnpm --filter book dev`(3000), `pnpm --filter workout dev`(3001). 전체는 `pnpm dev`.
- 검사: `pnpm check` (= `turbo run typecheck test build`). 앱 하나만: `pnpm --filter workout test`.
- 로컬 DB: Docker를 켜고 `npx supabase start && npx supabase db reset`. 마이그레이션을 바꾸면 `pnpm --filter @me/core db:types`.
- 새 앱 추가 절차는 `docs/ADDING-AN-APP.md`.

## Agent skills

### Issue tracker

GitHub Issues(`gh` CLI). 앱 개발 티켓만 이슈로 만들고, 개인이 할 일은 `docs/TODO.md`에 쓰고, 끝나면 `docs/DONE.md`로 옮긴다. See `docs/agents/issue-tracker.md`.

### Triage labels

기본 5개 라벨(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

single-context (루트 `GLOSSARY.md` + `docs/adr/`, 필요할 때 만든다). See `docs/agents/domain.md`.
