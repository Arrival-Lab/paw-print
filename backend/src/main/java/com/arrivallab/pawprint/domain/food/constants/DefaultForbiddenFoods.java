package com.arrivallab.pawprint.domain.food.constants;

import com.arrivallab.pawprint.domain.pet.entity.Species;

import java.util.Map;

/**
 * 종별 공통 금지 음식 기본값. 펫 등록 시 자동 prefill 용.
 * frontend/features/food/constants/defaultForbiddenFoods.ts 와 동기화 유지.
 * 출처: 한국 동물병원 일반 권고 + AAFCO/ASPCA 가이드라인.
 */
public final class DefaultForbiddenFoods {

    public static final Map<Species, String[]> BY_SPECIES = Map.of(
            Species.DOG, new String[] {
                    "초콜릿", "양파", "마늘", "포도", "건포도", "자일리톨(껌·사탕)",
                    "아보카도", "마카다미아", "익히지 않은 빵 반죽", "알코올", "카페인"
            },
            Species.CAT, new String[] {
                    "양파", "마늘", "초콜릿", "포도", "건포도", "우유·유제품(유당불내)",
                    "참치 통조림 다량(수은)", "생선 가시", "익히지 않은 생선·간(타이아민 결핍)",
                    "자일리톨", "알코올", "카페인", "백합·튤립"
            },
            Species.BIRD, new String[] {
                    "아보카도(치명적·persin 독성)", "초콜릿·코코아", "카페인·차", "알코올",
                    "양파", "마늘", "짠 음식·과자", "사과씨", "체리씨·복숭아씨(시안화물)",
                    "토마토 잎·줄기·덜 익은 열매", "버섯류", "파슬리", "후추·매운 향신료",
                    "지방 많은 견과류 다량", "테플론(PTFE) 코팅팬 가열 시 가스"
            },
            Species.REPTILE, new String[] {
                    "시금치·근대(수산염 과다)", "대황 잎", "아보카도", "양배추 다량(갑상선)",
                    "감귤류 과다", "야생 곤충(기생충)", "익히지 않은 육류(살모넬라)"
            },
            Species.SMALL_ANIMAL, new String[] {
                    "양파", "마늘", "초콜릿", "아보카도", "감귤류", "루바브",
                    "강낭콩 생", "견과류 다량", "카페인"
            },
            Species.OTHER, new String[0]
    );

    public static String[] forSpecies(Species species) {
        return BY_SPECIES.getOrDefault(species, new String[0]);
    }

    private DefaultForbiddenFoods() {}
}
