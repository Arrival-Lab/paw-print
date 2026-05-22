import type { Pet } from '../../pet/api/petApi';
import type { LifeStage } from '../../pet/utils/lifeStage';

export interface SeniorTip {
  title: string;
  body: string;
  /** 권장 검진 빈도 — "6개월 1회" 등 */
  checkupCadence?: string;
  /** 보호자가 집에서 체크할 항목 */
  watchFor: string[];
}

const COMMON_GERIATRIC_WATCHFOR = [
  '음수량 / 소변량의 갑작스러운 변화',
  '식욕 감소·체중 감소가 일주일 이상 지속',
  '발걸음·계단 오르내림이 느려짐',
  '구취가 심해지고 잇몸이 붉어짐',
];

const TIPS: Record<Pet['species'], Partial<Record<LifeStage, SeniorTip>>> = {
  DOG: {
    SENIOR: {
      title: '7세부터는 정기 검진을 시작할 때예요',
      body: '소리 없이 진행되는 신장·간·심장 질환을 조기에 잡으려면 혈액·소변검사를 정기적으로 받는 게 좋아요. 관절 통증도 슬슬 신호가 옵니다.',
      checkupCadence: '연 1회 종합 검진 (혈액·소변·X-ray)',
      watchFor: [
        '점프·계단 회피, 산책 후 다리 절기',
        '늘어진 수면, 부르면 잘 못 들음 (백내장·청력)',
        '평소보다 물 많이 마심',
        '잇몸 색·구취 변화',
      ],
    },
    GERIATRIC: {
      title: '노령기엔 작은 변화 하나도 흘려보내지 마세요',
      body: '신부전·심장병·종양 발생률이 높아지는 시기. 6개월마다 검진하고, 식이는 저단백·저인 처방식 고려가 필요할 수 있어요.',
      checkupCadence: '6개월 1회 종합 검진 + 분기 체중 측정',
      watchFor: COMMON_GERIATRIC_WATCHFOR,
    },
  },
  CAT: {
    SENIOR: {
      title: '고양이는 아픈 걸 잘 숨겨요',
      body: '7세부터는 만성 신장 질환(CKD)·갑상선항진증·당뇨가 흔해집니다. 조용한 변화를 놓치지 않으려면 정기 혈액·소변 검사가 중요해요.',
      checkupCadence: '연 1회 종합 검진 (특히 신장 기능)',
      watchFor: [
        '물을 평소보다 많이 마시거나 화장실을 자주 감',
        '체중이 슬슬 빠지는데 식욕은 비슷함',
        '활력 저하, 그루밍 감소',
        '뒷다리 절뚝거림 (관절염)',
      ],
    },
    GERIATRIC: {
      title: '노령묘는 분기마다 체중 측정을',
      body: '체중 5% 이상 감소는 유의미한 신호예요. 신부전·갑상선·종양 모두 체중 감소가 첫 단서일 수 있어요.',
      checkupCadence: '6개월 1회 종합 검진 + 매달 체중',
      watchFor: COMMON_GERIATRIC_WATCHFOR,
    },
  },
  BIRD: {
    SENIOR: {
      title: '새는 아픈 티를 거의 안 내요',
      body: '깃털·자세·소화 변화가 거의 유일한 신호. 부풀린 자세로 졸거나, 먹이를 줄이면 즉시 병원에.',
      checkupCadence: '연 1회 조류 전문 병원 방문',
      watchFor: ['깃털 빠짐 패턴 변화', '발이나 다리에 부종', '배설물 색·횟수 변화', '울음·활력 감소'],
    },
  },
  REPTILE: {
    SENIOR: {
      title: '파충류는 환경 관리가 곧 의료',
      body: '온도·습도·UVB 조명 점검이 일상 케어의 핵심. 식욕·탈피 주기 기록을 꾸준히 남겨주세요.',
      checkupCadence: '연 1회 특수동물 전문 병원',
      watchFor: ['탈피 부전 (피부 일부 남음)', '식욕 저하 2주 이상', '눈이 가라앉음·움푹 들어감', '비정상 변·점액 변'],
    },
  },
  SMALL_ANIMAL: {
    SENIOR: {
      title: '소동물은 변화가 빨라요',
      body: '햄스터·기니피그는 노화 속도가 빨라 매일 체중·식사량 체크가 효과적. 작은 변화도 빨리 병원으로.',
      checkupCadence: '6개월 1회 특수동물 전문 병원',
      watchFor: ['몸무게 감소', '치아 과성장 (입 닫지 못함)', '구석에 웅크리고 움직임 감소', '눈물·콧물·재채기'],
    },
  },
  OTHER: {
    SENIOR: {
      title: '나이가 들면 검진 주기를 짧게',
      body: '종마다 다르지만 시니어 진입 후엔 최소 연 1회 검진을 권장해요.',
      watchFor: ['식욕·체중 변화', '활력 감소', '평소와 다른 행동·자세'],
    },
  },
};

export function getSeniorTip(pet: Pet, stage: LifeStage): SeniorTip | null {
  // GERIATRIC 데이터가 없으면 SENIOR 폴백
  const speciesTips = TIPS[pet.species];
  if (!speciesTips) return null;
  return speciesTips[stage] ?? speciesTips.SENIOR ?? null;
}
