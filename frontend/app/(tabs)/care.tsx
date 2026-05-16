import { Redirect } from 'expo-router';

// 케어는 기록 탭의 '일상' sub-tab으로 통합됨.
// 옛 진입 경로(/care, router.push('/care')) 호환을 위해 redirect 유지.
export default function CareRedirect() {
  return <Redirect href="/(tabs)/records?tab=daily" />;
}
