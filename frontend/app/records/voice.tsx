import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  VOICE_DISABLED_MESSAGE_KEY,
  VOICE_BUILD_REQUIRED_MESSAGE_KEY,
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
  const { t } = useTranslation();
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
        <ScreenHeader title={t('record.voiceTitle')} back />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md }}>
          <Feather name="mic-off" size={48} color={Colors.text.tertiary} />
          <Text style={{ ...Typography.preset.body, color: Colors.text.secondary, textAlign: 'center' }}>
            {!petIdNum ? t('record.noPetSelected') : t(VOICE_DISABLED_MESSAGE_KEY)}
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
        t('record.recordFailTitle'),
        looksLikeMissingBinding ? t(VOICE_BUILD_REQUIRED_MESSAGE_KEY) : raw || t('record.micStartFail'),
      );
    }
  };

  const handleStop = async () => {
    try {
      const result = await recorder.stop();
      if (result) setRecorded(result);
      else Alert.alert(t('record.recordFailTitle'), t('record.recordFileFail'));
    } catch (e: any) {
      Alert.alert(t('record.stopFailTitle'), e?.message ?? t('record.stopFail'));
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
      const msg = e?.response?.data?.message ?? t('record.analyzeFailMsg');
      if (status === 402) showPremiumModal(msg);
      else Alert.alert(t('record.analyzeFailTitle'), msg);
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
      <ScreenHeader title={t('record.voiceTitle')} back />

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
          {t('record.voiceGuide')}
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
                {t('record.recording')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ width: '100%', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {recorder.isRecording ? (
            <Button variant="danger" size="lg" fullWidth onPress={handleStop}>
              {t('record.stopRecording')}
            </Button>
          ) : recorded ? (
            <>
              <Button variant="primary" size="lg" fullWidth onPress={handleAnalyze}>
                {t('record.startAnalyze')}
              </Button>
              <Button variant="ghost" fullWidth onPress={handleRetake}>
                {t('record.retake')}
              </Button>
            </>
          ) : (
            <Button variant="primary" size="lg" fullWidth onPress={handleStart}>
              {t('record.startRecording')}
            </Button>
          )}
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, textAlign: 'center' }}>
            {t('record.voiceQuotaNote')}
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
          <LoadingSpinner label={t('record.voiceTranscribing')} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
