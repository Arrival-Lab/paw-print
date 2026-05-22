/**
 * 음성 녹음 훅 — expo-av Audio.Recording 래퍼.
 *
 * ❗ 활성화 전제:
 *  1. `npx expo install expo-av`
 *  2. EAS 개발 클라이언트 재빌드
 *  3. iOS Info.plist: NSMicrophoneUsageDescription
 *  4. Android: RECORD_AUDIO 권한
 *  5. 아래 import 주석 해제 + ENABLE_VOICE_RECORDING=true
 *
 * 본 파일은 expo-av 미설치 환경에서도 컴파일되도록 stub 으로 작성됨.
 * 모듈 import는 dynamic require로 지연 — 플래그 false 면 native 모듈 안 건드림.
 */
import { useCallback, useRef, useState } from 'react';
import { ENABLE_VOICE_RECORDING } from './voiceConfig';

export interface VoiceRecorder {
  isRecording: boolean;
  duration: number; // ms
  start: () => Promise<void>;
  stop: () => Promise<{ uri: string; durationMs: number } | null>;
  cancel: () => Promise<void>;
}

export function useVoiceRecorder(): VoiceRecorder {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback(async () => {
    if (!ENABLE_VOICE_RECORDING) {
      throw new Error('Voice recording is not enabled in this build');
    }
    // 활성화 시 아래 주석 해제:
    // const { Audio } = require('expo-av');
    // const perm = await Audio.requestPermissionsAsync();
    // if (!perm.granted) throw new Error('마이크 권한이 필요해요');
    // await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    // const recording = new Audio.Recording();
    // await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    // await recording.startAsync();
    // recordingRef.current = recording;
    setIsRecording(true);
    setDuration(0);
    intervalRef.current = setInterval(() => setDuration((d) => d + 100), 100);
  }, []);

  const stop = useCallback(async () => {
    clearTimer();
    setIsRecording(false);
    if (!recordingRef.current) return null;
    // 활성화 시:
    // await recordingRef.current.stopAndUnloadAsync();
    // const uri = recordingRef.current.getURI();
    // const status = await recordingRef.current.getStatusAsync();
    // recordingRef.current = null;
    // return { uri, durationMs: status.durationMillis ?? duration };
    return null;
  }, [duration]);

  const cancel = useCallback(async () => {
    clearTimer();
    setIsRecording(false);
    setDuration(0);
    if (!recordingRef.current) return;
    // 활성화 시:
    // try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
    recordingRef.current = null;
  }, []);

  return { isRecording, duration, start, stop, cancel };
}
