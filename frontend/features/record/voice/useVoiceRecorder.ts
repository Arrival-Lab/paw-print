/**
 * 음성 녹음 훅 — expo-av Audio.Recording 래퍼.
 *
 * 안전 설계:
 *  - require 는 variable string 으로 호출 → Metro 정적 분석이 expo-av 를 잡지 않음.
 *    따라서 expo-av 미설치 환경에서도 빌드는 통과. 실제 호출 시점에 throw.
 *  - ENABLE_VOICE_RECORDING flag 가드 안에서만 expo-av 호출 → flag false 일 땐 native 모듈 안 건드림.
 *
 * 활성화 절차 (voiceConfig.ts 주석 참고):
 *  1. `npx expo install expo-av`
 *  2. EAS dev client 재빌드
 *  3. iOS NSMicrophoneUsageDescription / Android RECORD_AUDIO 권한 (app.json 에 이미 선언됨)
 *  4. voiceConfig.ts 의 ENABLE_VOICE_RECORDING = true
 */
import { useCallback, useRef, useState } from 'react';
import i18n from '../../../shared/i18n';
import { ENABLE_VOICE_RECORDING } from './voiceConfig';

export interface VoiceRecorder {
  isRecording: boolean;
  duration: number; // ms — UI 카운터. 정확도는 100ms 단위.
  start: () => Promise<void>;
  stop: () => Promise<{ uri: string; durationMs: number } | null>;
  cancel: () => Promise<void>;
}

/** Metro 정적 분석 회피용 — expo-av 미설치 환경에서도 빌드가 깨지지 않도록 variable string require. */
function loadExpoAv(): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const moduleId = 'expo-av';
  return require(moduleId);
}

export function useVoiceRecorder(): VoiceRecorder {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback(async () => {
    if (!ENABLE_VOICE_RECORDING) {
      throw new Error(i18n.t('record.voiceNotEnabled'));
    }
    const { Audio } = loadExpoAv();
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      throw new Error(i18n.t('record.voiceMicPermission'));
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    startedAtRef.current = Date.now();
    setIsRecording(true);
    setDuration(0);
    intervalRef.current = setInterval(() => {
      setDuration(Date.now() - startedAtRef.current);
    }, 100);
  }, []);

  const stop = useCallback(async () => {
    clearTimer();
    setIsRecording(false);
    if (!recordingRef.current) return null;
    const recording = recordingRef.current;
    recordingRef.current = null;
    const durationMs = Date.now() - startedAtRef.current;
    try {
      await recording.stopAndUnloadAsync();
    } catch (_) {
      // 이미 unload 된 경우 등 — uri만 확보 가능하면 진행
    }
    const uri: string | null = recording.getURI?.() ?? null;
    if (!uri) return null;
    return { uri, durationMs };
  }, []);

  const cancel = useCallback(async () => {
    clearTimer();
    setIsRecording(false);
    setDuration(0);
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
    } catch (_) {
      /* ignore */
    }
  }, []);

  return { isRecording, duration, start, stop, cancel };
}
