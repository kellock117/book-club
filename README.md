# me-apps

내가 쓰는 개인 앱들을 한 레포에 모은 pnpm + turbo 모노레포입니다. 앱마다 사이트(서브도메인)·비밀번호·Vercel 프로젝트가 따로고, DB(Supabase)와 공용 코드만 함께 씁니다.

| 앱 | 주소 | 설명 |
| --- | --- | --- |
| `apps/book` | `book.<도메인>` | 친구끼리 쓰는 독서 모임 기록 |
| `apps/workout` | `workout.<도메인>` | 운동 기록(세트 타이머·휴식 계산)과 근육 지도 |

| 패키지 | 역할 |
| --- | --- |
| `packages/core` (`@me/core`) | 서버 공용: 인증·잠금, 날짜, 백업, Supabase 서버 클라이언트, DB 타입 |
| `packages/ui` (`@me/ui`) | 화면 공용: Section/Card, Toast, LoginForm, 테마 |
| `packages/config` (`@me/config`) | tsconfig 기본값 |

규칙과 구조는 [`CLAUDE.md`](CLAUDE.md), 함정·가정·할 일은 [`docs/NOTES.md`](docs/NOTES.md), 새 앱 추가는 [`docs/ADDING-AN-APP.md`](docs/ADDING-AN-APP.md).

## 로컬 실행

pnpm은 corepack으로 씁니다 (버전은 루트 `package.json`의 `packageManager`에 고정).

```bash
corepack enable
pnpm install
cp apps/book/.env.example apps/book/.env.local        # 값을 채운다 (커밋하지 않는다)
cp apps/workout/.env.example apps/workout/.env.local
cp supabase/seed.example.sql supabase/seed.sql         # 멤버 이름을 바꾼다
npx supabase start && npx supabase db reset            # Docker가 켜져 있어야 한다
pnpm --filter book dev      # http://localhost:3000
pnpm --filter workout dev   # http://localhost:3001
```

앱 둘을 동시에 띄우려면 `pnpm dev`(전체). 두 앱은 비밀번호·쿠키가 따로라서 한쪽 로그인으로 다른 쪽이 열리지 않습니다.

## 검사

```bash
pnpm check    # 타입 검사 + 테스트 + 빌드 (turbo가 바뀐 부분만 다시 돈다)
```

## 배포 (GitHub Actions)

`main`에 푸시하면 `.github/workflows/deploy.yml`이 검사 → Supabase 마이그레이션 → Vercel 배포(앱별, 바뀐 앱만) 순서로 돕니다.
Vercel의 자체 Git 배포는 각 앱의 `vercel.json`에서 꺼 두었습니다(이중 배포 방지).

### GitHub 저장소 설정 (Settings → Secrets and variables → Actions)

| 시크릿 | 값 |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase 계정 → Access Tokens |
| `SUPABASE_PROJECT_REF` | 프로젝트 URL의 `xxxx.supabase.co`에서 `xxxx` |
| `SUPABASE_DB_PASSWORD` | 프로젝트 생성 때 정한 DB 비밀번호 |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | 로컬에서 `npx vercel link` 후 `.vercel/project.json` |
| `VERCEL_PROJECT_ID_BOOK` | book 프로젝트의 projectId |
| `VERCEL_PROJECT_ID_WORKOUT` | workout 프로젝트의 projectId |

`production` 환경(Settings → Environments)에 승인자를 지정하면 DB 변경과 배포 전에 사람이 확인합니다.

### Vercel 프로젝트 (앱마다 하나)

| 설정 | book | workout |
| --- | --- | --- |
| Root Directory | `apps/book` | `apps/workout` |
| 도메인 | `book.<도메인>` (기존 `*.vercel.app`도 유지) | `workout.<도메인>` |
| 환경 변수 | `apps/book/.env.example` 참고 | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `WORKOUT_PASSWORD` |

비밀 값은 GitHub이 아니라 Vercel 환경 변수에만 둡니다. 자세한 순서와 주의점은 `docs/NOTES.md`.
