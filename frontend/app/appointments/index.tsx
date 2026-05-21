import { Redirect } from 'expo-router';

/**
 * 진료 일정 standalone 화면은 기록 탭의 진료 통합 sub-tab 으로 흡수됨.
 * deeplink/구버전 진입을 위해 redirect 유지.
 */
export default function AppointmentsRedirect() {
  return <Redirect href={'/(tabs)/records?tab=medical' as any} />;
}
