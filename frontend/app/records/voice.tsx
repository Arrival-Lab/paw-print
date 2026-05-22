import { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import { useVoiceRecorder } from '../../features/record/voice/useVoiceRecorder';
import {
  ENABLE_VOICE_RECORDING,
  VOICE_DISABLED_MESSAGE,
  VOICE_BUILD_REQUIRED_MESSAGE,
} from '../../features/record/voice/voiceConfig';
import { recordApi } from '../../features/record/api/recordApi';
import { useUiStore } from '../../shared/store/uiStore';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const sec = (totalSec % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export default function VoiceRecordScreen() {
  const Colors = useColors();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const petIdNum = Number(petId);
  const recorder = useVoiceRecorder();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const [recorded, setRecorded] = useState<{ uri: string; durationMs: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // 화면 떠날 때 녹음 중이면 정리 — 안 그러면 마이크 leak.
  useEffect(() => {
    return () => {
      recorder.cancel().catch(() => {});
    };
    // recorder identity 매 렌더 바뀌므로 deps 비움 — unmount cleanup 이 의도.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ENABLE_VOICE_RECORDING || !petIdNum) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
        <ScreenHeader title="음성으로 진료기록" back />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md }}>
          <Feather name="mic-off" size={48} color={Colors.text.tertiary} />
          <Text style={{ ...Typography.preset.body, color: Colors.text.secondary, textAlign: 'center' }}>
            {!petIdNum ? '펫이 선택되지 않았어요' : VOICE_DISABLED_MESSAGE}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStart = async () => {
    try {
      setRecorded(null);
      await recorder.start();
    } catch (e: any) {
      const raw = e?.message ?? '';
      // expo-av native 모듈이 dev client 에 들어있지 않으면 보통 'NativeModule'/'Cannot find'/'RNExpoAv' 등 메시지.
      const looksLikeMissingBinding = /native|cannot find|RNExpo|undefined is not|module/i.test(raw);
      Alert.alert(
        '녹음 실패',
        looksLikeMissingBinding ? VOICE_BUILD_REQUIRED_MESSAGE : raw || '마이크를 시작할 수 없어요.',
      );
    }
  };

  const handleStop = async () => {
    try {
      const result = await recorder.stop();
      if (result) setRecorded(result);
      else Alert.alert('녹음 실패', '녹음 파일을 가져올 수 없어요. 다시 시도해주세요.');
    } catch (e: any) {
      Alert.alert('정지 실패', e?.message ?? '녹음을 정지할 수 없어요.');
    }
  };

  const handleRetake = async () => {
    setRecorded(null);
    if (recorder.isRecording) await recorder.cancel();
  };

  const handleAnalyze = async () => {
    if (!recorded) return;
    setAnalyzing(true);
    try {
      const ocrRaw = await recordApi.parseAudio(recorded.uri);
      const ocr = ocrRaw as any;
      router.replace({
        pathname: '/records/create',
        params: { petId: String(petIdNum), ocr: JSON.stringify(ocr) },
      });
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? '분석 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
      if (status === 402) showPremiumModal(msg);
      else Alert.alert('분석 실패', msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const displayDuration = recorder.isRecording
    ? recorder.duration
    : recorded
      ? recorded.durationMs
      : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="음성으로 진료기록" back />

      <View style={{ flex: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            ...Typography.preset.bodySmall,
            color: Colors.text.tertiary,
            textAlign: 'center',
            marginTop: Spacing.xl,
            lineHeight: Typography.size.sm * Typography.lineHeight.relaxed,
          }}
        >
          진료가 끝난 직후 자연스럽게 말로 정리해 주세요.{'\n'}
          병원·증상·진단·처방을 AI가 알아서 정리해 드려요.
        </Text>

        <View style={{ alignItems: 'center', gap: Spacing.lg }}>
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: recorder.isRecording ? Colors.status.errorBg : Colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: recorder.isRecording ? 2 : 0,
              borderColor: Colors.status.error,
            }}
          >
            <Feather
              name="mic"
              size={64}
              color={recorder.isRecording ? Colors.status.error : Colors.primary}
            />
          </View>

          <Text
            style={{
              ...Typography.preset.display,
              color: recorder.isRecording ? Colors.status.error : Colors.text.primary,
              letterSpacing: 1,
            }}
          >
            {formatDuration(displayDuration)}
          </Text>

          {recorder.isRecording ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.error }} />
              <Text style={{ ...Typography.preset.caption, color: Colors.status.error, fontWeight: Typography.weight.semibold }}>
                녹음 중
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ width: '100%', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {recorder.isRecording ? (
            <Button variant="danger" size="lg" fullWidth onPress={handleStop}>
              녹음 정지
            </Button>
          ) : recorded ? (
            <>
              <Button variant="primary" size="lg" fullWidth onPress={handleAnalyze}>
                분석 시작
              </Button>
              <Button variant="ghost" fullWidth onPress={handleRetake}>
                다시 녹음
              </Button>
            </>
          ) : (
            <Button variant="primary" size="lg" fullWidth onPress={handleStart}>
              녹음 시작
            </Button>
          )}
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, textAlign: 'center' }}>
            분석은 OCR과 같은 무료 한도(월 5회)를 공유해요
          </Text>
        </View>
      </View>

      {analyzing ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LoadingSpinner label="AI가 받아 적는 중" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
