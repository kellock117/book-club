# 독서 모임 사이트

Next.js(App Router) + TypeScript + Tailwind + Supabase + Recharts. 친구끼리 쓰는 독서 모임 기록 사이트입니다.

## 로컬 실행

```bash
npm ci
cp .env.example .env.local          # 값을 채운다 (이 파일은 커밋하지 않는다)
cp supabase/seed.example.sql supabase/seed.sql   # 멤버 이름을 바꾼다
npx supabase start && npx supabase db reset
npm run dev
```

## 배포 (GitHub Actions)

`main`에 푸시하면 `.github/workflows/deploy.yml`이 검사(typecheck·test·build) → Supabase 마이그레이션 → Vercel 배포 순서로 돈다.
Vercel의 자체 Git 배포는 `vercel.json`에서 꺼 두었다(이중 배포 방지).

### GitHub 저장소 설정 (Settings → Secrets and variables → Actions)

| 시크릿 | 값 |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase 계정 → Access Tokens |
| `SUPABASE_PROJECT_REF` | 프로젝트 URL의 `xxxx.supabase.co`에서 `xxxx` |
| `SUPABASE_DB_PASSWORD` | 프로젝트 생성 때 정한 DB 비밀번호 |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | 로컬에서 `npx vercel link` 후 `.vercel/project.json` |

`production` 환경(Settings → Environments)에 승인자를 지정하면 DB 변경과 배포 전에 사람이 확인한다.

### 앱 환경 변수 (Vercel 프로젝트 → Settings → Environment Variables)

`.env.example`의 변수를 Production에 넣는다. 서비스 롤 키 등 비밀 값은 GitHub이 아니라 Vercel에만 둔다.
