import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ensureMediaLibraryPermission } from '../../shared/utils/permissions';
import { useRecord, useDeleteRecord } from '../../features/record/hooks/useRecords';
import { recordApi } from '../../features/record/api/recordApi';
import { Spacing, Typography, Config } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { formatDate } from '../../shared/utils/format';
import ScreenHeader from '../../shared/components/ScreenHeader';
import PetContextBadge from '../../features/pet/components/PetContextBadge';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUiStore } from '../../shared/store/uiStore';
import { useGlossaryStore } from '../../features/glossary/store/glossaryStore';

function LabeledField({ label, value }: { label: string; value: string | null | undefined }) {
  const Colors = useColors();
  if (!value) return null;
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{ ...Typography.preset.label, color: Colors.text.tertiary, marginBottom: Spacing.xs }}>
        {label}
      </Text>
      <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>{value}</Text>
    </View>
  );
}

export default function RecordDetailScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const { id, petId } = useLocalSearchParams<{ id: string; petId: string }>();
  const recordId = Number(id);
  const petIdNum = Number(petId);

  const { data: record, isLoading, refetch } = useRecord(petIdNum, recordId);
  const { mutate: deleteRecord, isPending: deleting } = useDeleteRecord(petIdNum);
  const [uploading, setUploading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const isFree = user?.subscriptionType === 'FREE';

  const handleDelete = () => {
    Alert.alert(t('record.deleteTitle'), t('record.deleteConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: () => {
          // Optimistic — 캐시는 이미 onMutate 에서 제거됨. 사용자는 즉시 목록으로.
          router.back();
          deleteRecord(recordId, {
            onError: (e: any) => {
              Alert.alert(t('common.deleteFailTitle'), e?.response?.data?.message ?? t('common.tryAgainLater'));
            },
          });
        },
      },
    ]);
  };

  const handleAddPhoto = async () => {
    const attachedCount = record?.attachments.length ?? 0;
    const remainingSlots = isFree ? Math.max(Config.freeMaxPhotosPerRecord - attachedCount, 0) : 99;
    if (remainingSlots === 0) {
      showPremiumModal(t('record.photoLimit', { max: Config.freeMaxPhotosPerRecord }));
      return;
    }
    if (!(await ensureMediaLibraryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: remainingSlots > 1,
      selectionLimit: remainingSlots,
      // iOS HEIC → JPEG 강제 변환.
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploading(true);
    try {
      const assets = result.assets.slice(0, remainingSlots);
      const failed: string[] = [];
      for (const asset of assets) {
        try {
          await recordApi.uploadAttachment(petIdNum, recordId, asset.uri);
        } catch (e: any) {
          failed.push(e?.response?.data?.message ?? t('common.unknownError'));
        }
      }
      refetch();
      if (failed.length > 0) {
        Alert.alert(
          t('record.photoUploadPartialTitle'),
          t('record.photoUploadPartialBody', { count: failed.length, message: failed[0] }),
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    await recordApi.deleteAttachment(petIdNum, recordId, attachmentId);
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <LoadingSpinner label={t('common.loading')} />
      </SafeAreaView>
    );
  }
  if (!record) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={t('record.title')}
        back
        titleSlot={petIdNum ? <PetContextBadge petId={petIdNum} locked /> : undefined}
        actions={[
          { icon: 'edit-2', label: t('action.edit'), onPress: () => router.push({ pathname: '/records/create', params: { id, petId } }) },
          { icon: 'trash-2', label: t('action.delete'), onPress: handleDelete },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }}>
        <Card variant="tinted" padding="lg" style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, marginBottom: 4 }}>
            {record.hospitalName ?? t('record.noHospitalName')}
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
            {formatDate(record.visitedAt, 'long')}
          </Text>
        </Card>

        <Card variant="outlined" padding="lg" style={{ marginBottom: Spacing.lg }}>
          <LabeledField label={t('record.symptoms')} value={record.symptoms} />
          <LabeledField label={t('record.diagnosis')} value={record.diagnosis} />
          <LabeledField label={t('record.treatment')} value={record.treatment} />
          <LabeledField label={t('record.prescription')} value={record.prescription} />
          <LabeledField label={t('record.memo')} value={record.notes} />
          {!record.symptoms && !record.diagnosis && !record.treatment && !record.prescription && !record.notes && (
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, textAlign: 'center', paddingVertical: Spacing.lg }}>
              {t('record.emptyContent')}
            </Text>
          )}
        </Card>

        <TouchableOpacity
          onPress={() => useGlossaryStore.getState().open()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            backgroundColor: Colors.primaryLight,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            borderRadius: Spacing.borderRadius.lg,
            marginBottom: Spacing.lg,
          }}
        >
          <Feather name="book-open" size={16} color={Colors.text.accent} />
          <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.accent }}>
            {t('record.glossaryCta')}
          </Text>
        </TouchableOpacity>

        <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.md }}>
          {t('record.attachments', { count: record.attachments.length })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {record.attachments.map((att) => (
            <View key={att.id} style={{ position: 'relative' }}>
              <Image source={{ uri: att.fileUrl }} style={{ width: 92, height: 92, borderRadius: Spacing.borderRadius.md }} />
              <TouchableOpacity
                onPress={() => handleDeleteAttachment(att.id)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  backgroundColor: Colors.overlay,
                  borderRadius: 10, width: 22, height: 22,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Feather name="x" size={12} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
          {uploading && (
            <View style={{ width: 92, height: 92, borderRadius: Spacing.borderRadius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner inline />
            </View>
          )}
          <TouchableOpacity
            onPress={handleAddPhoto}
            style={{
              width: 92, height: 92, borderRadius: Spacing.borderRadius.md,
              borderWidth: 1.5, borderColor: Colors.borderStrong, borderStyle: 'dashed',
              alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white,
            }}
          >
            <Feather name="plus" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
