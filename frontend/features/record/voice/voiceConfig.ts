/**
 * 음성 녹음 → 진료기록 prefill (A6) 기능 활성화 플래그.
 *
 * 준비 완료된 상태:
 *  ✓ expo-av ~16.0.8 dependencies 에 등록
 *  ✓ iOS NSMicrophoneUsageDescription (app.json)
 *  ✓ Android RECORD_AUDIO 권한 (app.json)
 *  ✓ expo-av config plugin 등록 (app.json plugins)
 *  ✓ useVoiceRecorder 실제 동작 코드
 *  ✓ /records/voice 녹음 화면
 *  ✓ 백엔드 POST /api/records/audio (Gemini multimodal)
 *
 * 활성화 후 첫 사용 전 필수:
 *  ⚠️ EAS dev client 재빌드 (`npx eas build --profile development --platform ios`)
 *      app.json 의 권한 변경이 native 빌드에 들어가야 마이크 권한 팝업이 정상 동작함.
 *      이미 expo-av 가 node_modules 에 있어도 native 바인딩이 dev client 에
 *      들어 있는지는 마지막 빌드 시점 기준이므로 한 번 재빌드 권장.
 */
export const ENABLE_VOICE_RECORDING = true;

/** flag false 일 때 또는 환경 미충족 시 안내 메시지 i18n 키. 렌더에서 t() 로 변환. */
export const VOICE_DISABLED_MESSAGE_KEY = 'record.voiceDisabled';

/** 호출 실패 (네이티브 바인딩 없음 등) 시 사용자 안내 메시지 i18n 키. */
export const VOICE_BUILD_REQUIRED_MESSAGE_KEY = 'record.voiceBuildRequired';
