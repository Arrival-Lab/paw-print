// 펫 식별 색상 팔레트. 펫 생성/수정 시 보호자가 직접 고르고, 미지정 펫은 id 기반으로
// 이 팔레트에서 자동 폴백한다. 캘린더 마커·홈 요약 등에서 어떤 펫인지 한눈에 구분하는 용도.
// 작은 dot/swatch 로만 쓰여(텍스트 안 올림) WCAG 본문 대비 규칙 비적용 — 서로 구분만 되면 OK.

export const PET_COLOR_PALETTE = [
  '#F4A8B8', // 로즈
  '#F6A35C', // 코랄오렌지
  '#F4C95D', // 옐로우
  '#7EAD9B', // 세이지그린
  '#6CA9D6', // 스카이블루
  '#9B6BCC', // 라벤더
  '#E891B3', // 핑크
  '#B0895E', // 브라운
] as const;

/**
 * 펫의 표시 색을 반환한다. color 가 지정돼 있으면 그대로, 없으면 id 기반으로 팔레트에서 폴백.
 * id 가 없으면(엣지) 팔레트 첫 색.
 */
export function petColorOf(pet: { id?: number | null; color?: string | null } | null | undefined): string {
  if (pet?.color) return pet.color;
  const id = pet?.id ?? 0;
  return PET_COLOR_PALETTE[id % PET_COLOR_PALETTE.length];
}
