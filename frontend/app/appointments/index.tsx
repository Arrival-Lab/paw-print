import { Redirect } from 'expo-router';

/**
 * 진료 일정 standalone 화면은 기록 탭의 진료일정 sub-tab 으로 통합됨.
 * deeplink/구버전 진입을 위해 redirect 유지.
 */
export default function AppointmentsRedirect() {
  return <Redirect href={'/(tabs)/records?tab=appointments' as any} />;
}
