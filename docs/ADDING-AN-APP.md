# 새 앱 추가하기

앱 하나 = `apps/<이름>` Next 앱 하나 = Vercel 프로젝트 하나 = 서브도메인 하나. 아래 순서대로 하면 된다.
예시는 `apps/workout`을 보면 가장 작은 형태를 알 수 있다.

## 1. 만들기 전에 정할 것
- 앱 id(영문 소문자, 예: `money`). 쿠키 이름(`site_money`)과 서명 키에 쓰이니 한 번 정하면 바꾸지 않는다.
- 비밀번호 환경 변수 이름(예: `MONEY_PASSWORD`).
- 포트(개발용): book 3000, workout 3001, 다음 앱은 3002부터.
- 새 DB 테이블이 필요한지. 필요하면 `supabase/migrations/`에 마이그레이션부터 쓴다.

## 2. 폴더 만들기
1. `apps/workout`을 참고해 `apps/<이름>/`에 아래를 만든다.
   - `package.json` (이름, `dev` 포트, 의존성에 `@me/core`·`@me/ui`는 `workspace:*`; 앱에서 직접 import하는 패키지는 모두 여기 적는다)
   - `tsconfig.json` (`@me/config/tsconfig.base.json` 상속), `next.config.ts` (`transpilePackages: ['@me/core','@me/ui']`), `postcss.config.mjs`
   - `vercel.json` (`git.deploymentEnabled: false`, 크론이 있으면 `crons`)
   - `.env.example`
2. 구조는 `app/(auth)/login`, `app/(main)/…`(레이아웃에서 `requireSite`), `lib/site.ts`(APP_ID, PASSWORD_ENV), `proxy.ts`.
3. `app/globals.css`: `@import 'tailwindcss'; @import '@me/ui/theme.css'; @source "../../../packages/ui/src";` 다음에 `:root`에 `--paper --surface --ink --muted --line --accent --accent-ink --danger` 값을 정한다.
4. 루트에서 `pnpm install`.

## 3. 잠금
- `lib/site.ts`에 `APP_ID`, `PASSWORD_ENV`.
- 로그인 액션은 `apps/workout/app/(auth)/login/actions.ts`를 그대로 복사해 쓴다(rate-limit, 앱 전용 쿠키).
- `app/(main)/layout.tsx`와 모든 서버 액션 첫 줄에 `requireSite(APP_ID, PASSWORD_ENV)`.

## 4. DB
- 테이블을 만들었다면 `packages/core/src/backup-tables.ts`에 표를 추가하고 `ALL_BACKUP_TABLES`에 이어 붙인다 (임시 데이터는 제외).
- 마이그레이션을 적용한 뒤 `pnpm --filter @me/core db:types`로 DB 타입을 다시 만든다.

## 5. 배포 설정
1. Vercel에서 프로젝트를 새로 만들고 Root Directory를 `apps/<이름>`으로 한다. 환경 변수를 넣는다.
2. 도메인 `<이름>.<도메인>`을 연결한다.
3. GitHub 시크릿 `VERCEL_PROJECT_ID_<이름 대문자>`를 추가한다 (`npx vercel link`로 projectId 확인).
4. `.github/workflows/deploy.yml`의 `vercel` 잡 matrix에 `- app: <이름>` / `project_secret: VERCEL_PROJECT_ID_<이름 대문자>`를 더한다. verify의 자리표시 env에 새 비밀번호 변수도 더한다.

## 6. 문서
- 이 앱만의 규칙은 `CLAUDE.md`, 함정·가정은 `docs/NOTES.md`에 바로 적는다.
- `README.md`의 앱 표와 Vercel 표에 한 줄 추가한다.
- 노션 위키(🧰 내 앱)에 사용자용·개발자용 페이지를 추가한다.

## 7. 확인
- `pnpm turbo typecheck test build`
- `pnpm --filter <이름> dev`: 로그인 → 화면 → (다른 앱 쿠키로 못 들어가는지) → 375px 폭에서 확인.
