import { Redirect } from 'expo-router';

// 케어는 '일상' 탭의 '매일체크' sub-tab 으로 통합됨.
// 옛 진입 경로(/care, router.push('/care')) 호환을 위해 redirect 유지.
export default function CareRedirect() {
  return <Redirect href="/(tabs)/daily?tab=daily-check" />;
}
