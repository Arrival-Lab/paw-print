import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { MetricChart } from '../features/metric/components/MetricChart';
import { MetricForm } from '../features/metric/components/MetricForm';
import {
  useMetricChart, useMetrics, useCreateMetric, useDeleteMetric,
} from '../features/metric/hooks/useMetrics';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Colors, Spacing, Typography } from '../constants';
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
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<MetricType>('WEIGHT');
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const isFree = user?.subscriptionType === 'FREE';
  const now = new Date();
  const from = isFree
    ? new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10)
    : undefined;
  const to = now.toISOString().slice(0, 10);

  const { data: chartData = [], isLoading: chartLoading } = useMetricChart(
    selectedPetId ?? 0, activeType, from, to,
  );
  const { data: metricsData, fetchNextPage, hasNextPage } = useMetrics(
    selectedPetId ?? 0, activeType,
  );
  const { mutate: create, isPending: creating } = useCreateMetric(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteMetric(selectedPetId ?? 0);

  const metrics = metricsData?.pages.flatMap((p) => p.content) ?? [];

  const handleCreate = (data: MetricRequest) => {
    create(data, { onSuccess: () => setShowForm(false) });
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
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          수치 트래킹
        </Text>
        {selectedPetId && (
          <TouchableOpacity onPress={() => setShowForm(true)} hitSlop={8}>
            <Feather name="plus" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
            반려동물을 선택해주세요
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxl }}>
          {/* 타입 탭 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm }}>
            {METRIC_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                onPress={() => handleTabPress(tab.value)}
                style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                  borderRadius: Spacing.borderRadius.full, borderWidth: 1,
                  backgroundColor: activeType === tab.value ? Colors.primary : Colors.white,
                  borderColor: activeType === tab.value ? Colors.primary : Colors.border }}>
                <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.medium,
                  color: activeType === tab.value ? Colors.white : Colors.text.secondary }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isFree && (
            <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
              backgroundColor: Colors.primaryLight, borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
              <Text style={{ fontSize: Typography.size.xs, color: Colors.primary }}>
                무료 플랜은 최근 1개월 데이터만 표시됩니다.
              </Text>
            </View>
          )}

          {/* 차트 */}
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            {chartLoading
              ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
              : <MetricChart data={chartData} unit={UNITS[activeType]} />}
          </View>

          {/* 최근 기록 */}
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
              color: Colors.text.primary, marginBottom: Spacing.md }}>
              기록
            </Text>
            {metrics.length === 0 ? (
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary,
                textAlign: 'center', marginTop: Spacing.lg }}>
                아직 기록이 없어요
              </Text>
            ) : (
              metrics.map((m) => (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center',
                  paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
                      color: Colors.text.primary }}>
                      {m.value} {m.unit ?? UNITS[m.metricType]}
                    </Text>
                    <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary, marginTop: 2 }}>
                      {m.measuredAt}
                    </Text>
                  </View>
                  {m.metricName && (
                    <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary,
                      marginRight: Spacing.md }}>
                      {m.metricName}
                    </Text>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={8}>
                    <Feather name="trash-2" size={16} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            {hasNextPage && (
              <TouchableOpacity
                onPress={() => fetchNextPage()}
                style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <Text style={{ fontSize: Typography.size.sm, color: Colors.primary }}>더 보기</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* 수치 입력 모달 */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-background">
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={{ fontSize: Typography.size.md, color: Colors.text.secondary }}>취소</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: Typography.size.lg,
              fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
              수치 입력
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <MetricForm
            onSubmit={(data) => handleCreate({ ...data, metricName: data.metricName ?? undefined })}
            loading={creating}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
