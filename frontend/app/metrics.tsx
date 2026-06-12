import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, Alert, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { MetricChart } from '../features/metric/components/MetricChart';
import { MetricForm } from '../features/metric/components/MetricForm';
import {
  useMetricChart, useMetrics, useCreateMetric, useDeleteMetric,
} from '../features/metric/hooks/useMetrics';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import { confirmLeaveIfDirty } from '../shared/utils/confirmLeave';
import ScreenHeader from '../shared/components/ScreenHeader';
import Chip from '../shared/components/Chip';
import Fab from '../shared/components/Fab';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import type { MetricType, MetricRequest } from '../features/metric/api/metricApi';

const METRIC_TABS: { label: string; value: MetricType }[] = [
  { label: '체중', value: 'WEIGHT' },
  { label: 'BUN', value: 'BUN' },
  { label: '크레아티닌', value: 'CREATININE' },
  { label: '직접입력', value: 'CUSTOM' },
];

const UNITS: Record<MetricType, string> = {
  WEIGHT: 'kg',
  BUN: 'mg/dL',
  CREATININE: 'mg/dL',
  CUSTOM: '',
};

export default function MetricsScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<MetricType>('WEIGHT');
  const [showForm, setShowForm] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const isFree = user?.subscriptionType === 'FREE';
  const now = new Date();
  const from = isFree
    ? new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10)
    : undefined;
  const to = now.toISOString().slice(0, 10);

  const { data: chartData = [], isLoading: chartLoading } = useMetricChart(selectedPetId ?? 0, activeType, from, to);
  const { data: metricsData, fetchNextPage, hasNextPage } = useMetrics(selectedPetId ?? 0, activeType);
  const { mutate: create, isPending: creating } = useCreateMetric(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteMetric(selectedPetId ?? 0);

  const metrics = metricsData?.pages.flatMap((p) => p.content) ?? [];

  const closeForm = () => { setShowForm(false); setFormDirty(false); };
  const requestCloseForm = () => confirmLeaveIfDirty(formDirty, closeForm);

  const handleCreate = (data: MetricRequest) => {
    create(data, { onSuccess: closeForm });
  };

  const handleDelete = (metricId: number) => {
    Alert.alert('삭제', '이 수치를 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(metricId) },
    ]);
  };

  const handleTabPress = (type: MetricType) => {
    if (isFree && type !== 'WEIGHT') {
      showPremiumModal('프리미엄 구독 시 모든 수치 항목을 무제한으로 기록할 수 있어요.');
    }
    setActiveType(type);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="수치 트래킹" back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxxl }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              gap: Spacing.sm,
            }}
          >
            {METRIC_TABS.map((tab) => (
              <Chip
                key={tab.value}
                label={tab.label}
                selected={activeType === tab.value}
                onPress={() => handleTabPress(tab.value)}
              />
            ))}
          </ScrollView>

          {isFree && (
            <View
              style={{
                marginHorizontal: Spacing.lg,
                marginBottom: Spacing.md,
                backgroundColor: Colors.status.infoBg,
                borderRadius: Spacing.borderRadius.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
              }}
            >
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.primaryDark, flex: 1 }}>
                무료 플랜은 최근 1개월 데이터만 표시됩니다
              </Text>
            </View>
          )}

          <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }}>
            {chartLoading ? (
              <LoadingSpinner inline label="차트 그리는 중" />
            ) : (
              <MetricChart
                data={chartData}
                // 차트 endpoint 는 unit 을 내려주지 않음 — 펫 단위로 unit 이 통일된다고 가정하고
                // 최근 metric 의 unit 으로 라벨 결정. (예: 작은 동물 g 으로 기록 시 그래프도 g 으로 표기)
                unit={metrics[0]?.unit ?? UNITS[activeType]}
                width={Dimensions.get('window').width - Spacing.xl * 2}
              />
            )}
          </View>

          <View style={{ paddingHorizontal: Spacing.xl }}>
            <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.md }}>
              기록
            </Text>
            {metrics.length === 0 ? (
              <Text
                style={{
                  ...Typography.preset.bodySmall,
                  color: Colors.text.tertiary,
                  textAlign: 'center',
                  paddingVertical: Spacing.xl,
                }}
              >
                아직 기록이 없어요
              </Text>
            ) : (
              metrics.map((m) => (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: Spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>
                      {m.value} {m.unit ?? UNITS[m.metricType]}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                      {m.measuredAt}
                    </Text>
                  </View>
                  {m.metricName ? (
                    <Text
                      style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginRight: Spacing.md }}
                    >
                      {m.metricName}
                    </Text>
                  ) : null}
                  <Pressable onPress={() => handleDelete(m.id)} hitSlop={Spacing.hitSlop}>
                    <Feather name="trash-2" size={16} color={Colors.text.tertiary} />
                  </Pressable>
                </View>
              ))
            )}
            {hasNextPage && (
              <Pressable onPress={() => fetchNextPage()} style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <Text style={{ ...Typography.preset.label, color: Colors.primary }}>더 보기</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}

      {selectedPetId ? <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel="수치 추가" /> : null}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestCloseForm}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader title="수치 입력" back={requestCloseForm} />
          <MetricForm
            onSubmit={(data) => handleCreate({ ...data, metricName: data.metricName ?? undefined })}
            loading={creating}
            onDirtyChange={setFormDirty}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
