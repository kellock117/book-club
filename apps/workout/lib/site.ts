/**
 * 운동 앱의 잠금 설정. proxy.ts, 로그인 액션, 서버 액션이 같은 값을 쓰도록 한곳에 모았다.
 * 앱 id를 바꾸면 쿠키 이름(site_workout)과 서명 키가 바뀌어 모두 로그아웃된다.
 */
export const APP_ID = 'workout';

/** 비밀번호가 들어 있는 환경 변수 이름 (book의 SITE_PASSWORD와 다르다) */
export const PASSWORD_ENV = 'WORKOUT_PASSWORD';
