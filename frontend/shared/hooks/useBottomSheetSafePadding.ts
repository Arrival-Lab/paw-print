import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../../constants';

/**
 * 바텀시트/모달 콘텐츠의 최하단 paddingBottom 값을 반환.
 * 시스템 navigation(제스처 인디케이터·소프트키)을 가리기 위해 inset.bottom 을 더함.
 *
 * 호출부:
 *   const padBottom = useBottomSheetSafePadding();
 *   <View style={{ paddingBottom: padBottom }} />
 *
 * 기기별:
 *   - 제스처 모드 안드로이드: inset.bottom ~ 24dp → 24 + xxxl(32) = 56dp
 *   - 3-button 네비 안드로이드: inset.bottom ~ 48dp → 48 + 32 = 80dp
 *   - iOS notch 기기: inset.bottom ~ 34dp → 34 + 32 = 66dp
 *   - 풀스크린 기기: inset.bottom = 0 → 32dp (기존과 동일)
 *
 * extra: 기본 패딩이 xxxl 보다 작아야 하는 곳 (작은 시트) 이나 더 커야 하는 곳에서 override.
 */
export function useBottomSheetSafePadding(extra: number = Spacing.xxxl): number {
  const insets = useSafeAreaInsets();
  return extra + insets.bottom;
}
