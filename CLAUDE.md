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

## 백업
- 앱이 테이블을 새로 만들면 `packages/core/src/backup-tables.ts`에 등록한다. 일시 데이터(draft 등)는 뺀다.

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

## 명령
- 개발 서버: `pnpm --filter book dev`(3000), `pnpm --filter workout dev`(3001). 전체는 `pnpm dev`.
- 검사: `pnpm check` (= `turbo run typecheck test build`). 앱 하나만: `pnpm --filter workout test`.
- 로컬 DB: Docker를 켜고 `npx supabase start && npx supabase db reset`. 마이그레이션을 바꾸면 `pnpm --filter @me/core db:types`.
- 새 앱 추가 절차는 `docs/ADDING-AN-APP.md`.
