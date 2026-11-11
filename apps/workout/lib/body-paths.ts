/**
 * 인체 근육 지도의 SVG 경로 데이터 (앞면·뒷면). 좌표계는 한쪽 몸(오른쪽 반)만 그려 둔 것이고,
 * `center`가 없는 경로는 화면에서 좌우 반전(scale(-1 1))해 한 번 더 그린다.
 *
 * - muscle: 근육 키(`lib/exercises.ts`의 MuscleKey). null이면 뼈대·피부·결 같은 장식이라 눌러도 반응이 없다.
 * - cls: 'b' 몸통 바탕, 's' 피부, 'r' 쉬는 근육(회색), 'm' 눌러볼 수 있는 근육, 'd' 근육 결 선.
 *   색은 app/workout.css의 .b .s .r .m .d 가 정한다.
 * - 아티팩트(근육 지도)에서 그대로 옮긴 값이라 숫자를 손으로 고치지 않는다.
 */
import type { MuscleKey } from './exercises';

export type BodyPath = { muscle: MuscleKey | null; d: string; cls: 'b' | 's' | 'r' | 'm' | 'd'; center?: boolean };

const BASE: BodyPath[] = [
  { muscle: null, d: 'M0 64 L-12 66 Q-14 80 -44 86 Q-58 92 -56 130 Q-50 170 -46 236 Q-50 250 -50 262 L0 272Z', cls: 'b' },
  { muscle: null, d: 'M-46 88 Q-78 88 -82 120 Q-90 160 -86 202 L-66 202 Q-60 160 -56 130Z', cls: 'b' },
  { muscle: null, d: 'M-50 250 Q-60 300 -52 360 Q-46 380 -48 400 Q-52 440 -40 486 L-18 486 Q-14 440 -14 400 Q-12 380 -10 360 Q-2 320 -2 272Z', cls: 'b' },
  { muscle: null, d: 'M-11 52 L-11 80 L0 82 L0 52Z', cls: 's' },
  { muscle: null, d: 'M0 13 C-14 13 -21 26 -21 40 C-21 55 -12 66 0 66', cls: 's' },
  { muscle: null, d: 'M-66 200 L-88 198 Q-98 222 -98 248 Q-98 268 -96 284 L-84 284 Q-80 252 -72 228 Q-66 214 -66 200Z', cls: 'r' },
  { muscle: null, d: 'M-86 200 Q-94 236 -91 282', cls: 'd' },
  { muscle: null, d: 'M-84 282 L-98 282 Q-105 300 -101 314 Q-95 324 -87 317 Q-82 300 -84 282Z', cls: 's' }
];

export const FRONT: BodyPath[] = [
  ...BASE,
  { muscle: null, d: 'M-20 36 Q-25 39 -22 47', cls: 'd' },
  { muscle: null, d: 'M-3 62 L-10 62 L-6 84 L-1 86Z', cls: 'r' },
  { muscle: "traps", d: 'M-10 66 Q-24 80 -46 86 L-22 87 Q-12 80 -10 66Z', cls: 'm' },
  { muscle: "pec", d: 'M-2 92 L-44 89 Q-51 100 -52 113 Q-50 131 -36 141 Q-18 145 -2 139Z', cls: 'm' },
  { muscle: null, d: 'M-6 104 Q-24 102 -42 96', cls: 'd' },
  { muscle: "fdelt", d: 'M-44 88 Q-58 83 -64 92 Q-62 112 -66 132 Q-58 122 -50 110 Q-46 98 -44 88Z', cls: 'm' },
  { muscle: "sdelt", d: 'M-64 92 Q-75 90 -79 104 Q-81 122 -71 136 L-66 132 Q-62 112 -64 92Z', cls: 'm' },
  { muscle: "biceps", d: 'M-60 132 Q-74 132 -80 150 Q-84 176 -80 199 L-67 199 Q-61 170 -60 132Z', cls: 'm' },
  { muscle: null, d: 'M-71 140 Q-74 170 -73 196', cls: 'd' },
  { muscle: "triceps", d: 'M-80 150 Q-88 166 -86 197 L-80 199 Q-84 176 -80 150Z', cls: 'm' },
  { muscle: null, d: 'M-40 143 Q-49 135 -54 124 Q-58 143 -51 162 Q-46 152 -40 148Z', cls: 'r' },
  { muscle: null, d: 'M-43 140 L-52 140 M-45 148 L-54 150', cls: 'd' },
  { muscle: "obl", d: 'M-18 150 Q-38 150 -48 166 Q-50 205 -44 234 Q-30 242 -18 238 Q-21 190 -18 150Z', cls: 'm' },
  { muscle: "abs", d: 'M-1 144 L-17 147 Q-20 192 -17 240 Q-10 252 -1 256Z', cls: 'm' },
  { muscle: null, d: 'M-17 170 L-1 168 M-18 194 L-1 193 M-18 218 L-1 218', cls: 'd' },
  { muscle: "hipflex", d: 'M-22 240 Q-38 240 -48 250 Q-42 262 -28 272 Q-22 258 -22 240Z', cls: 'm' },
  { muscle: "quads", d: 'M-48 252 Q-58 300 -52 356 Q-48 374 -40 382 L-38 360 Q-40 310 -40 270 Q-44 258 -48 252Z', cls: 'm' },
  { muscle: "quads", d: 'M-40 262 Q-32 256 -26 262 Q-22 310 -28 362 L-38 366 Q-42 310 -40 262Z', cls: 'm' },
  { muscle: "adduct", d: 'M-24 266 Q-12 268 -4 276 Q-4 300 -10 326 Q-16 340 -22 344 Q-24 300 -24 266Z', cls: 'm' },
  { muscle: "quads", d: 'M-22 340 Q-11 350 -13 372 Q-18 384 -28 380 L-30 362 Q-26 350 -22 340Z', cls: 'm' },
  { muscle: null, d: 'M-38 382 Q-30 376 -20 382 Q-19 396 -29 400 Q-38 396 -38 382Z', cls: 's' },
  { muscle: null, d: 'M-40 404 Q-52 428 -46 466 L-42 476 Q-44 440 -36 404Z', cls: 'r' },
  { muscle: "calves", d: 'M-27 402 Q-12 418 -14 448 Q-18 472 -24 482 L-33 482 Q-34 440 -27 402Z', cls: 'm' },
  { muscle: null, d: 'M-34 400 Q-44 428 -40 478 L-34 482 Q-34 440 -28 402Z', cls: 'r' },
  { muscle: null, d: 'M-38 484 L-20 484 Q-14 498 -12 508 Q-26 512 -42 508 Q-42 496 -38 484Z', cls: 's' },
  { muscle: null, d: 'M0 92 L0 140 M0 146 L0 254', cls: 'd', center: true }
];

export const BACK: BodyPath[] = [
  ...BASE,
  { muscle: "lats", d: 'M-22 126 Q-40 136 -52 136 Q-56 160 -50 190 Q-44 214 -32 232 Q-20 226 -12 210 Q-14 180 -10 160 Q-16 146 -22 126Z', cls: 'm' },
  { muscle: null, d: 'M-26 104 Q-44 100 -54 108 Q-56 124 -46 134 Q-34 132 -24 124Z', cls: 'r' },
  { muscle: null, d: 'M-28 116 Q-40 116 -52 122', cls: 'd' },
  { muscle: "traps", d: 'M0 64 L-12 68 Q-30 82 -50 90 Q-34 100 -22 120 Q-12 150 0 170Z', cls: 'm' },
  { muscle: "midback", d: 'M-3 100 L-26 98 Q-24 118 -8 142 L-3 142Z', cls: 'm' },
  { muscle: "erector", d: 'M-2 170 L-11 166 Q-15 210 -12 252 L-2 254Z', cls: 'm' },
  { muscle: "rdelt", d: 'M-48 90 Q-66 87 -74 100 Q-76 116 -70 130 Q-62 116 -56 106 Q-50 98 -48 90Z', cls: 'm' },
  { muscle: "sdelt", d: 'M-70 96 Q-80 104 -80 118 Q-78 128 -70 132 Q-74 116 -70 96Z', cls: 'm' },
  { muscle: "triceps", d: 'M-58 130 Q-74 128 -82 144 Q-88 172 -82 200 L-68 200 Q-62 170 -58 130Z', cls: 'm' },
  { muscle: null, d: 'M-71 140 Q-71 170 -74 196', cls: 'd' },
  { muscle: "glutes", d: 'M-3 238 Q-30 232 -48 246 Q-50 258 -45 266 Q-24 256 -3 258Z', cls: 'm' },
  { muscle: "glutes", d: 'M-3 256 Q-28 251 -46 264 Q-54 290 -40 312 Q-20 318 -3 306Z', cls: 'm' },
  { muscle: "hams", d: 'M-46 314 Q-53 350 -44 384 L-30 386 Q-32 350 -28 318Z', cls: 'm' },
  { muscle: "hams", d: 'M-26 316 Q-10 318 -6 326 Q-8 360 -14 386 L-28 386 Q-30 350 -26 316Z', cls: 'm' },
  { muscle: null, d: 'M-36 384 Q-28 381 -18 386 Q-20 396 -29 398 Q-36 394 -36 384Z', cls: 'r' },
  { muscle: "calves", d: 'M-28 392 Q-46 400 -46 430 Q-42 452 -32 460 Q-28 430 -28 392Z', cls: 'm' },
  { muscle: "calves", d: 'M-26 392 Q-10 400 -12 430 Q-15 452 -25 462 Q-28 430 -26 392Z', cls: 'm' },
  { muscle: "calves", d: 'M-43 444 Q-39 470 -33 484 L-21 484 Q-15 470 -14 444 Q-21 462 -28 464 Q-36 461 -43 444Z', cls: 'm' },
  { muscle: null, d: 'M-34 484 L-22 484 Q-20 498 -22 508 L-36 508 Q-38 496 -34 484Z', cls: 's' },
  { muscle: null, d: 'M0 70 L0 256', cls: 'd', center: true }
];
