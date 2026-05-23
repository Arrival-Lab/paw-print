import { useState } from 'react';
import {
  Modal, Pressable, View, Text, TouchableOpacity, Platform, StyleSheet, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ensureMediaLibraryPermission, ensureCameraPermission } from '../../../shared/utils/permissions';
import { useQueryClient } from '@tanstack/react-query';
import { Spacing, Typography, Config, Elevation } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import UsageMeter from '../../../shared/components/UsageMeter';
import OcrProgressOverlay from './OcrProgressOverlay';
import { useParseOcr } from '../hooks/useRecords';
import { useUsage } from '../../subscription/hooks/useUsage';
import { useAuthStore } from '../../auth/store/authStore';
import { recordApi } from '../api/recordApi';
import { ENABLE_VOICE_RECORDING, VOICE_DISABLED_MESSAGE } from '../voice/voiceConfig';

interface Props {
  visible: boolean;
  onClose: () => void;
  petId: number | null;
}

/**
 * 진료기록 작성 ActionSheet — AI 촬영(OCR) · 갤러리 · 직접 입력 3가지 흐름.
 * RecordsTab FAB / 진료 통합 탭의 기록 섹션 + 버튼에서 공통 사용.
 */
export default function RecordCreateSheet({ visible, onClose, petId }: Props) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const [ocrLoading, setOcrLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isFree = user?.subscriptionType === 'FREE';
  const parseOcr = useParseOcr();
  const { data: usage } = useUsage();
  const queryClient = useQueryClient();

  const handleOcrCamera = async () => {
    console.log('[ocr] camera tapped');
    try {
      if (!(await ensureCameraPermission())) { console.log('[ocr] camera perm denied'); return; }
      await handleOcr(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 }));
    } catch (e) {
      console.log('[ocr] camera error', e);
      Alert.alert('카메라 오류', String((e as any)?.message ?? e));
    }
  };

  const handleOcrLibrary = async () => {
    console.log('[ocr] library tapped');
    try {
      if (!(await ensureMediaLibraryPermission())) { console.log('[ocr] library perm denied'); return; }
      await handleOcr(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 }));
    } catch (e) {
      console.log('[ocr] library error', e);
      Alert.alert('갤러리 오류', String((e as any)?.message ?? e));
    }
  };

  const handleOcr = async (launchFn: () => Promise<ImagePicker.ImagePickerResult>) => {
    onClose();
    // Modal dismiss animation 끝나기를 기다린 뒤 picker 호출.
    // 동시 present 면 iOS 가 silent fail.
    await new Promise((r) => setTimeout(r, 350));
    console.log('[ocr] launching picker');
    const result = await launchFn();
    console.log('[ocr] picker result', { canceled: result.canceled, count: result.assets?.length });
    if (result.canceled || !result.assets?.[0]) return;
    setOcrLoading(true);
    try {
      const ocr = await parseOcr.mutateAsync(result.assets[0].uri);
      router.push({ pathname: '/records/create', params: { petId, ocr: JSON.stringify(ocr) } });
    } finally {
      setOcrLoading(false);
    }
  };

  /** C4 빠른 저장: 사진 → OCR → record 즉시 생성 → 사진 첨부 → 끝. 검토 단계 건너뜀. */
  const handleQuickSave = async () => {
    if (!petId) return;
    if (!(await ensureMediaLibraryPermission())) return;
    onClose();
    await new Promise((r) => setTimeout(r, 350));
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setOcrLoading(true);
    try {
      const ocr = await parseOcr.mutateAsync(uri);
      const today = new Date().toISOString().slice(0, 10);
      const created = await recordApi.createRecord(petId, {
        visitedAt: ocr?.visitedAt ?? today,
        hospitalName: ocr?.hospitalName ?? undefined,
        symptoms: ocr?.symptoms ?? undefined,
        diagnosis: ocr?.diagnosis ?? undefined,
        treatment: ocr?.treatment ?? undefined,
        prescription: ocr?.prescription ?? undefined,
      });
      const recordId = created?.id;
      if (recordId) {
        try { await recordApi.uploadAttachment(petId, recordId, uri); } catch (_) { /* 사진 실패해도 기록 자체는 살림 */ }
      }
      queryClient.invalidateQueries({ queryKey: ['records', petId] });
      queryClient.invalidateQueries({ queryKey: ['records', 'all'] });
      Alert.alert('저장 완료', 'AI가 인식한 내용으로 저장했어요. 기록을 열어 확인·편집할 수 있어요.', [
        { text: '닫기', style: 'cancel' },
        { text: '열기', onPress: () => router.push({ pathname: '/records/[id]', params: { id: recordId, petId } } as any) },
      ]);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? '저장 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
      if (status !== 402) Alert.alert('저장 실패', msg);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <GlassOverlay onPress={onClose} style={{ justifyContent: 'flex-end' }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              borderTopLeftRadius: Spacing.borderRadius.xxl,
              borderTopRightRadius: Spacing.borderRadius.xxl,
              overflow: 'hidden',
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: Colors.glass.border,
            }}
          >
            <BlurView
              intensity={50}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={{
                backgroundColor: Colors.glass.surfaceStrong,
                paddingTop: Spacing.md,
                paddingBottom: Spacing.xxxxl,
              }}
            >
              <View
                style={{
                  alignSelf: 'center',
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: Colors.border,
                  marginBottom: Spacing.lg,
                }}
              />
              <Text
                style={{
                  ...Typography.preset.title,
                  color: Colors.text.primary,
                  textAlign: 'center',
                  marginBottom: Spacing.xs,
                }}
              >
                진료기록 추가
              </Text>
              <Text
                style={{
                  ...Typography.preset.caption,
                  color: Colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                영수증·처방전 한 장이면 AI가 채워줘요
              </Text>

              {isFree ? (
                <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
                  <UsageMeter
                    current={usage?.ocrThisMonth ?? 0}
                    max={Config.freeMaxOcrPerMonth}
                    label="AI 자동입력 · 이번 달"
                    unit="회"
                    icon="zap"
                  />
                </View>
              ) : null}

              <View style={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
                <TouchableOpacity
                  onPress={handleOcrCamera}
                  activeOpacity={0.9}
                  style={{
                    padding: Spacing.lg,
                    borderRadius: Spacing.borderRadius.xl,
                    backgroundColor: Colors.primaryDark,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    ...Elevation.card,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="camera" size={20} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Feather name="zap" size={12} color={Colors.secondary} />
                      <Text style={{ ...Typography.preset.caption, color: Colors.secondary, fontWeight: Typography.weight.bold }}>
                        AI 자동 입력
                      </Text>
                    </View>
                    <Text style={{ ...Typography.preset.body, color: Colors.white, fontWeight: Typography.weight.bold, marginTop: 2 }}>
                      영수증·처방전 촬영
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                      {isFree ? `사진 한 장이면 끝 · 무료 월 ${Config.freeMaxOcrPerMonth}회` : '사진 한 장으로 모든 필드 자동 입력'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOcrLibrary}
                  activeOpacity={0.85}
                  style={{
                    padding: Spacing.md,
                    borderRadius: Spacing.borderRadius.lg,
                    backgroundColor: Colors.primaryLight,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="image" size={16} color={Colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.bodyMedium, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
                      갤러리에서 사진 선택
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                      이미 찍어둔 영수증·처방전도 OK
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={Colors.primaryDark} />
                </TouchableOpacity>

                {/* A6 음성 녹음 — 진료 후 녹음 → 진료기록 자동 채움 (expo-av 설치 후 활성화) */}
                {petId ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (ENABLE_VOICE_RECORDING) {
                        onClose();
                        router.push({ pathname: '/records/voice', params: { petId } } as any);
                      } else {
                        Alert.alert('곧 만나요', VOICE_DISABLED_MESSAGE);
                      }
                    }}
                    activeOpacity={0.85}
                    style={{
                      padding: Spacing.md,
                      borderRadius: Spacing.borderRadius.lg,
                      backgroundColor: Colors.surface,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.md,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      opacity: ENABLE_VOICE_RECORDING ? 1 : 0.7,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: Colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="mic" size={16} color={Colors.text.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                        음성으로 기록
                      </Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        {ENABLE_VOICE_RECORDING ? '진료 후 녹음 → AI가 받아 적기' : '곧 만나요'}
                      </Text>
                    </View>
                    {ENABLE_VOICE_RECORDING ? <Feather name="chevron-right" size={16} color={Colors.text.secondary} /> : null}
                  </TouchableOpacity>
                ) : null}

                {/* C4 빠른 저장 — 검토 없이 OCR 결과 그대로 즉시 저장 */}
                {petId ? (
                  <TouchableOpacity
                    onPress={handleQuickSave}
                    activeOpacity={0.85}
                    style={{
                      padding: Spacing.md,
                      borderRadius: Spacing.borderRadius.lg,
                      backgroundColor: Colors.secondaryLight,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: Colors.secondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="zap" size={16} color={Colors.text.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                        한 번에 저장
                      </Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        검토 안 하고 AI 결과 그대로 — 나중에 편집
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    router.push({ pathname: '/records/create', params: { petId } });
                  }}
                  activeOpacity={0.7}
                  style={{
                    padding: Spacing.md,
                    borderRadius: Spacing.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                  }}
                >
                  <Feather name="edit-3" size={16} color={Colors.text.secondary} />
                  <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, flex: 1 }}>
                    직접 입력
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    빈 양식
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </GlassOverlay>
      </Modal>

      <OcrProgressOverlay visible={ocrLoading} isComplete={!parseOcr.isPending && ocrLoading} />
    </>
  );
}
