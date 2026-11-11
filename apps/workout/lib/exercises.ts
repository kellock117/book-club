/**
 * 운동 종목 데이터. 근육 지도와 운동 기록이 같이 쓰는 "무엇을 하는가"의 원본이다.
 *
 * 종목을 바꾸려면 이 파일만 고친다 (화면·계산은 이 목록을 읽는다).
 * - 이름을 바꾸면 이미 저장된 기록(workout_sets.exercise)과 이름이 달라져서 "지난 기록에서 불러오기"가 끊긴다.
 *   바꿀 땐 DB의 같은 이름도 함께 바꾼다.
 * - lv(근육 강도): 3 주동근, 2 보조근, 1 안정화. 일반적인 근활성 기준의 대략적인 구분이다.
 */

export type Part = 'lower' | 'upper';
export const PART_LABEL: Record<Part, string> = { lower: '하체', upper: '상체' };
export const PARTS: Part[] = ['lower', 'upper'];

export type MuscleKey =
  | 'pec' | 'fdelt' | 'sdelt' | 'rdelt' | 'biceps' | 'triceps' | 'abs' | 'obl' | 'hipflex'
  | 'quads' | 'adduct' | 'calves' | 'traps' | 'lats' | 'midback' | 'erector' | 'glutes' | 'hams';

/** 근육 키 → [일상 이름, 해부학 이름] */
export const MUSCLE_NAMES: Record<MuscleKey, [string, string]> = {
  pec: ['가슴', '대흉근'],
  fdelt: ['어깨 앞', '전면 삼각근'],
  sdelt: ['어깨 옆', '측면 삼각근'],
  rdelt: ['어깨 뒤', '후면 삼각근'],
  biceps: ['팔 앞', '이두근'],
  triceps: ['팔 뒤', '삼두근'],
  abs: ['복근', '복직근'],
  obl: ['옆구리', '복사근'],
  hipflex: ['골반 앞', '고관절 굴곡근·장요근'],
  quads: ['앞허벅지', '대퇴사두근'],
  adduct: ['안쪽 허벅지', '내전근'],
  calves: ['종아리', '비복근·가자미근'],
  traps: ['목 뒤·등 위', '승모근'],
  lats: ['등 옆 넓은 부위', '광배근'],
  midback: ['등 중앙', '능형근·중부 승모근'],
  erector: ['허리', '척추기립근'],
  glutes: ['엉덩이', '둔근'],
  hams: ['뒷허벅지', '햄스트링'],
};

export type Level = 1 | 2 | 3;
export const LEVEL_LABEL: Record<Level, string> = { 3: '주동근', 2: '보조근', 1: '안정화' };

export type Unit = '회' | '초';

export interface Exercise {
  /** 저장·표시에 쓰는 정식 이름 (DB의 workout_sets.exercise 와 같다) */
  name: string;
  part: Part;
  /** 짧은 이름 (좁은 화면·토스트용). 없으면 name */
  short?: string;
  /** 주로 쓰이는 부위 한 단어 (카드의 배지) */
  area: string;
  /** 권장 세트·횟수 설명 */
  scheme: string;
  lv: Partial<Record<MuscleKey, Level>>;
  tips: string[];
  /** 지난 기록이 없을 때 쓰는 기본 횟수 (3세트) */
  defaultReps: number;
  unit: Unit;
}

export const EXERCISES: Exercise[] = [
  { name: '불가리안 스플릿 스쿼트', part: 'lower', short: '불가리안', area: '허벅지·엉덩이', scheme: '좌우 8~12회 × 3~4세트', defaultReps: 8, unit: '회',
    lv: { quads: 3, glutes: 3, adduct: 2, hams: 1, abs: 1 },
    tips: ['앞무릎이 안쪽으로 무너지지 않게 발끝 방향과 맞추기', '상체를 살짝 숙이면 엉덩이, 세우면 앞허벅지에 더 걸려요', '뒷발은 올려두기만 하고 힘은 앞발로'] },
  { name: '템포 스쿼트', part: 'lower', area: '허벅지', scheme: '12~15회 × 3세트, 내릴 때 3초', defaultReps: 12, unit: '회',
    lv: { quads: 3, glutes: 2, adduct: 2, hams: 1, erector: 1, abs: 1 },
    tips: ['내려갈 때 3초를 정확히 세기', '바닥에서 튕기지 말고 잠깐 멈췄다 올라오기', '허리가 말리면 깊이를 줄이기'] },
  { name: '한 다리 루마니안 데드리프트', part: 'lower', short: '한 다리 RDL', area: '뒷허벅지·엉덩이', scheme: '좌우 10회 × 3세트', defaultReps: 10, unit: '회',
    lv: { hams: 3, glutes: 3, erector: 2, abs: 1, obl: 1 },
    tips: ['무릎은 살짝 굽힌 채 고정하고 엉덩이를 뒤로 빼기', '등은 곧게, 골반은 수평 유지', '흔들리면 벽이나 의자를 가볍게 짚어도 괜찮아요'] },
  { name: '한 다리 힙 브릿지', part: 'lower', short: '힙 브릿지', area: '엉덩이', scheme: '좌우 12~15회 × 3세트', defaultReps: 12, unit: '회',
    lv: { glutes: 3, hams: 2, quads: 1, erector: 1, abs: 1 },
    tips: ['꼭대기에서 엉덩이를 꽉 쥐고 1~2초 유지', '허리를 젖히지 말고 골반을 말아 올리기', '발뒤꿈치로 바닥을 밀기'] },
  { name: '한 발 카프 레이즈', part: 'lower', short: '카프 레이즈', area: '종아리', scheme: '좌우 15~20회 × 3세트', defaultReps: 15, unit: '회',
    lv: { calves: 3 },
    tips: ['계단 끝에서 하면 가동범위가 커져요', '맨 위에서 1초 멈추고 천천히 내려오기', '무릎을 펴면 비복근, 살짝 굽히면 가자미근 비중이 커져요'] },
  { name: '템포 푸시업', part: 'upper', area: '가슴', scheme: '한계 직전까지 × 4세트, 내릴 때 3초', defaultReps: 10, unit: '회',
    lv: { pec: 3, fdelt: 2, triceps: 2, abs: 1 },
    tips: ['내려갈 때 3초, 올라올 때 1초', '팔꿈치는 몸통에서 45도 정도', '몸은 판자처럼 일직선 유지'] },
  { name: '턱걸이', part: 'upper', area: '등', scheme: '4세트', defaultReps: 5, unit: '회',
    lv: { lats: 3, biceps: 2, midback: 2, rdelt: 2, traps: 1, erector: 1, abs: 1 },
    tips: ['팔꿈치를 옆구리 쪽으로 끌어내리는 느낌', '어깨가 귀 쪽으로 으쓱하지 않게 견갑골부터 내리기', '내려올 때도 천천히 버티기'] },
  { name: '파이크 푸시업', part: 'upper', area: '어깨', scheme: '8~12회 × 3세트', defaultReps: 8, unit: '회',
    lv: { fdelt: 3, sdelt: 2, triceps: 2, pec: 1, traps: 1, abs: 1 },
    tips: ['엉덩이를 높여 역V자 자세 만들기', '머리는 손 사이보다 약간 앞쪽으로', '발을 의자에 올리면 강도가 올라가요'] },
  { name: '친업', part: 'upper', area: '이두', scheme: '3세트', defaultReps: 5, unit: '회',
    lv: { biceps: 3, lats: 3, midback: 2, rdelt: 1, abs: 1 },
    tips: ['손바닥이 나를 보게 어깨너비로 잡기', '팔꿈치를 앞으로 모아 이두에 힘을 싣기', '내려올 때 2~3초 버티고 팔을 끝까지 펴기'] },
  { name: '의자 딥', part: 'upper', area: '삼두', scheme: '3세트', defaultReps: 10, unit: '회',
    lv: { triceps: 3, pec: 1, fdelt: 1 },
    tips: ['팔꿈치 90도까지만 내려가기', '어깨가 앞으로 말리지 않게 가슴 펴기', '팔꿈치는 뒤로 곧게 접기'] },
];

/** 이름으로 종목 찾기 (없으면 undefined) */
export const findExercise = (name: string): Exercise | undefined => EXERCISES.find((e) => e.name === name);

/** 구분(상체/하체)의 종목들, 목록에 적힌 순서 그대로 = 운동하는 순서 */
export const exercisesOf = (part: Part): Exercise[] => EXERCISES.filter((e) => e.part === part);

/** 좁은 곳에 쓰는 이름 */
export const shortName = (name: string): string => findExercise(name)?.short ?? name;

/** 근육 지도에서 고르는 항목: 종목 하나이거나, 그날 종목 전체를 합친 "데이 전체" */
export interface MapEntry {
  /** 'day:lower' 같은 합산 항목은 isDay=true */
  key: string;
  isDay: boolean;
  part: Part;
  title: string;
  scheme: string;
  lv: Partial<Record<MuscleKey, Level>>;
  tips: string[];
}

/** 그날 종목 전체를 합쳐서, 근육마다 가장 높은 강도를 취한다. */
function dayEntry(part: Part): MapEntry {
  const lv: Partial<Record<MuscleKey, Level>> = {};
  for (const e of exercisesOf(part)) {
    for (const [k, v] of Object.entries(e.lv) as [MuscleKey, Level][]) lv[k] = Math.max(lv[k] ?? 0, v) as Level;
  }
  return {
    key: `day:${part}`,
    isDay: true,
    part,
    title: `${PART_LABEL[part]} 데이 전체`,
    scheme: '이 날 운동 전체를 합친 범위',
    lv,
    tips:
      part === 'lower'
        ? ['앞허벅지·엉덩이·뒷허벅지·종아리까지 하체 전체를 고르게 써요', '한 다리 운동이 많아서 좌우 균형과 코어도 함께 단련돼요', '다음 날 근육통이 심하면 하루 쉬거나 상체 데이로']
        : ['미는 운동(가슴·어깨·삼두)이 당기는 운동(등·이두)보다 많아요', '어깨 건강을 위해 당기기 볼륨을 충분히 챙기세요', '어깨 뒤쪽은 당기기로만 자극돼요'],
  };
}

/** 근육 지도 선택 목록: 하체 데이 전체 → 하체 종목들 → 상체 데이 전체 → 상체 종목들 */
export const MAP_ENTRIES: MapEntry[] = PARTS.flatMap((part) => [
  dayEntry(part),
  ...exercisesOf(part).map((e): MapEntry => ({ key: e.name, isDay: false, part, title: e.name, scheme: e.scheme, lv: e.lv, tips: e.tips })),
]);
