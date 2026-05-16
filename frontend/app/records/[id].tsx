import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRecord, useDeleteRecord } from '../../features/record/hooks/useRecords';
import { recordApi } from '../../features/record/api/recordApi';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { formatDate } from '../../shared/utils/format';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

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
  const { id, petId } = useLocalSearchParams<{ id: string; petId: string }>();
  const recordId = Number(id);
  const petIdNum = Number(petId);

  const { data: record, isLoading, refetch } = useRecord(petIdNum, recordId);
  const { mutate: deleteRecord, isPending: deleting } = useDeleteRecord(petIdNum);
  const [uploading, setUploading] = useState(false);

  const handleDelete = () => {
    Alert.alert('진료기록 삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRecord(recordId, { onSuccess: () => router.back() }) },
    ]);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    try {
      await recordApi.uploadAttachment(petIdNum, recordId, result.assets[0].uri);
      refetch();
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
        <LoadingSpinner label="불러오는 중" />
      </SafeAreaView>
    );
  }
  if (!record) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="진료기록"
        back
        actions={[
          { icon: 'edit-2', label: '수정', onPress: () => router.push({ pathname: '/records/create', params: { id, petId } }) },
          { icon: 'trash-2', label: '삭제', onPress: handleDelete },
        ]}
      />

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }}>
        <Card variant="tinted" padding="lg" style={{ marginBottom: Spacing.md }}>
          <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, marginBottom: 4 }}>
            {record.hospitalName ?? '병원명 없음'}
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
            {formatDate(record.visitedAt, 'yyyy년 MM월 dd일')}
          </Text>
        </Card>

        <Card variant="outlined" padding="lg" style={{ marginBottom: Spacing.lg }}>
          <LabeledField label="증상" value={record.symptoms} />
          <LabeledField label="진단" value={record.diagnosis} />
          <LabeledField label="치료" value={record.treatment} />
          <LabeledField label="처방" value={record.prescription} />
          <LabeledField label="메모" value={record.notes} />
          {!record.symptoms && !record.diagnosis && !record.treatment && !record.prescription && !record.notes && (
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, textAlign: 'center', paddingVertical: Spacing.lg }}>
              기록된 내용이 없어요
            </Text>
          )}
        </Card>

        <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.md }}>
          첨부파일 ({record.attachments.length})
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
