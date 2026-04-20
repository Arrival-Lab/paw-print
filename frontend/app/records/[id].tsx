import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRecord, useDeleteRecord, useUpdateRecord } from '../../features/record/hooks/useRecords';
import { recordApi } from '../../features/record/api/recordApi';
import { Colors, Spacing, Typography } from '../../constants';
import { formatDate } from '../../shared/utils/format';
import Button from '../../shared/components/Button';

function LabeledField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary,
        fontWeight: Typography.weight.medium, marginBottom: Spacing.xs }}>
        {label}
      </Text>
      <Text style={{ fontSize: Typography.size.md, color: Colors.text.primary,
        lineHeight: Typography.size.md * Typography.lineHeight.normal }}>
        {value}
      </Text>
    </View>
  );
}

export default function RecordDetailScreen() {
  const { id, petId } = useLocalSearchParams<{ id: string; petId: string }>();
  const recordId = Number(id);
  const petIdNum = Number(petId);

  const { data: record, isLoading, refetch } = useRecord(petIdNum, recordId);
  const { mutate: deleteRecord, isPending: deleting } = useDeleteRecord(petIdNum);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const handleDelete = () => {
    Alert.alert('진료기록 삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: () => deleteRecord(recordId, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingIdx(-1);
    try {
      await recordApi.uploadAttachment(petIdNum, recordId, result.assets[0].uri);
      refetch();
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    await recordApi.deleteAttachment(petIdNum, recordId, attachmentId);
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!record) return null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          진료기록 상세
        </Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/records/create', params: { id, petId } })}
          style={{ marginRight: Spacing.md }} hitSlop={8}>
          <Feather name="edit-2" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} disabled={deleting} hitSlop={8}>
          <Feather name="trash-2" size={20} color={Colors.status.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        {/* 기본 정보 */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.lg, marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: Typography.size.xl, fontWeight: Typography.weight.bold,
            color: Colors.text.primary, marginBottom: Spacing.xs }}>
            {record.hospitalName ?? '병원명 없음'}
          </Text>
          <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary }}>
            {formatDate(record.visitedAt, 'yyyy년 MM월 dd일')}
          </Text>
        </View>

        {/* 상세 내용 */}
        <View style={{ backgroundColor: Colors.white, borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.lg, marginBottom: Spacing.lg,
          borderWidth: 1, borderColor: Colors.border }}>
          <LabeledField label="증상" value={record.symptoms} />
          <LabeledField label="진단" value={record.diagnosis} />
          <LabeledField label="치료" value={record.treatment} />
          <LabeledField label="처방" value={record.prescription} />
          <LabeledField label="메모" value={record.notes} />
          {!record.symptoms && !record.diagnosis && !record.treatment
            && !record.prescription && !record.notes && (
            <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
              기록된 내용이 없어요
            </Text>
          )}
        </View>

        {/* 첨부파일 */}
        <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
          color: Colors.text.primary, marginBottom: Spacing.md }}>
          첨부파일
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {record.attachments.map((att) => (
            <View key={att.id} style={{ position: 'relative' }}>
              <Image source={{ uri: att.fileUrl }}
                style={{ width: 88, height: 88, borderRadius: Spacing.borderRadius.md }} />
              <TouchableOpacity
                onPress={() => handleDeleteAttachment(att.id)}
                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: Colors.overlay,
                  borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={12} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
          {uploadingIdx !== null && (
            <View style={{ width: 88, height: 88, borderRadius: Spacing.borderRadius.md,
              backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
          <TouchableOpacity
            onPress={handleAddPhoto}
            style={{ width: 88, height: 88, borderRadius: Spacing.borderRadius.md,
              borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
              alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="plus" size={24} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
