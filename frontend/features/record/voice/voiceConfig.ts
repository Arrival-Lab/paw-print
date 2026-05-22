/**
 * 음성 녹음 → 진료기록 prefill (A6) 기능 활성화 플래그.
 *
 * 활성화 조건:
 *  1. expo-av 설치: `npx expo install expo-av`
 *  2. EAS 개발 클라이언트 재빌드: `npx eas build --profile development --platform ios`
 *  3. iOS Info.plist: NSMicrophoneUsageDescription 추가 (앱이 마이크 사용 사유 안내)
 *  4. Android AndroidManifest.xml: <uses-permission android:name="android.permission.RECORD_AUDIO" />
 *  5. 본 파일에서 ENABLE_VOICE_RECORDING = true 로 변경
 *  6. VoiceRecordButton 컴포넌트의 import 주석 제거
 *
 * 백엔드 API는 이미 준비됨: POST /api/records/audio (Gemini multimodal → 진료기록 필드 추출)
 */
export const ENABLE_VOICE_RECORDING = false;

/** 마이크 미설치 환경에서 사용자가 옵션 탭 시 보여줄 안내. */
export const VOICE_DISABLED_MESSAGE =
  '음성 녹음 기능은 다음 앱 업데이트에 추가될 예정이에요. 조금만 기다려주세요!';
