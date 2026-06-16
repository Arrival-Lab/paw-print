import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal, Pressable, View, Text, TouchableOpacity, Platform, StyleSheet, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ensureMediaLibraryPermission, ensureCameraPermission } from '../../../shared/utils/permissions';
import { useQueryClient } from '@tanstack/react-query';
import { Spacing, Typography, Elevation, getLimits, isUnlimited } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import UsageMeter from '../../../shared/components/UsageMeter';
import OcrProgressOverlay from './OcrProgressOverlay';
import { useParseOcr } from '../hooks/useRecords';
import { useUsage } from '../../subscription/hooks/useUsage';
import { useAuthStore } from '../../auth/store/authStore';
import { recordApi } from '../api/recordApi';
import { ENABLE_VOICE_RECORDING, VOICE_DISABLED_MESSAGE_KEY } from '../voice/voiceConfig';

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
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding(Spacing.xxxxl);
  const [ocrLoading, setOcrLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const limits = getLimits(user?.subscriptionType);
  const ocrLimited = !isUnlimited(limits.maxOcrPerMonth);
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
      Alert.alert(t('record.cameraError'), String((e as any)?.message ?? e));
    }
  };

  const handleOcrLibrary = async () => {
    console.log('[ocr] library tapped');
    try {
      if (!(await ensureMediaLibraryPermission())) { console.log('[ocr] library perm denied'); return; }
      await handleOcr(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 }));
    } catch (e) {
      console.log('[ocr] library error', e);
      Alert.alert(t('record.galleryError'), String((e as any)?.message ?? e));
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
      Alert.alert(t('record.saveDoneTitle'), t('record.quickSaveBody'), [
        { text: t('action.close'), style: 'cancel' },
        { text: t('record.open'), onPress: () => router.push({ pathname: '/records/[id]', params: { id: recordId, petId } } as any) },
      ]);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? t('record.saveFailMsg');
      if (status !== 402) Alert.alert(t('record.saveFailTitle'), msg);
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
                paddingBottom: padBottom,
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
                {t('record.addTitle')}
              </Text>
              <Text
                style={{
                  ...Typography.preset.caption,
                  color: Colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                {t('record.sheetSubtitle')}
              </Text>

              {ocrLimited ? (
                <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
                  <UsageMeter
                    current={usage?.ocrThisMonth ?? 0}
                    max={limits.maxOcrPerMonth}
                    label={t('record.usageLabel')}
                    unit={t('record.usageUnit')}
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
                        {t('record.aiAutoFill')}
                      </Text>
                    </View>
                    <Text style={{ ...Typography.preset.body, color: Colors.white, fontWeight: Typography.weight.bold, marginTop: 2 }}>
                      {t('record.captureReceipt')}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                      {ocrLimited ? t('record.captureDescLimited', { max: limits.maxOcrPerMonth }) : t('record.captureDesc')}
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
                      {t('record.pickFromGallery')}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                      {t('record.pickFromGalleryDesc')}
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
                        Alert.alert(t('record.comingSoon'), t(VOICE_DISABLED_MESSAGE_KEY));
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
                        {t('record.voiceRecord')}
                      </Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        {ENABLE_VOICE_RECORDING ? t('record.voiceRecordDesc') : t('record.comingSoon')}
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
                        {t('record.quickSave')}
                      </Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        {t('record.quickSaveDesc')}
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
                    {t('record.manualEntry')}
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    {t('record.blankForm')}
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
