import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Modal, ScrollView, Alert, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { MetricChart } from '../features/metric/components/MetricChart';
import { MetricForm } from '../features/metric/components/MetricForm';
import { localizeUnit } from '../features/metric/api/metricApi';
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

const METRIC_TAB_VALUES: MetricType[] = ['WEIGHT', 'BUN', 'CREATININE', 'CUSTOM'];

const UNITS: Record<MetricType, string> = {
  WEIGHT: 'kg',
  BUN: 'mg/dL',
  CREATININE: 'mg/dL',
  CUSTOM: '',
};

export default function MetricsScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
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
    Alert.alert(t('action.delete'), t('metric.deleteConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('action.delete'), style: 'destructive', onPress: () => remove(metricId) },
    ]);
  };

  const handleTabPress = (type: MetricType) => {
    if (isFree && type !== 'WEIGHT') {
      showPremiumModal(t('metric.premiumAllTypes'));
    }
    setActiveType(type);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={t('metric.trackingTitle')} back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title={t('appointment.selectPet')} tone="muted" />
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
            {METRIC_TAB_VALUES.map((tab) => (
              <Chip
                key={tab}
                label={t(`metric.type.${tab}`)}
                selected={activeType === tab}
                onPress={() => handleTabPress(tab)}
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
                {t('metric.freeRangeNote')}
              </Text>
            </View>
          )}

          <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }}>
            {chartLoading ? (
              <LoadingSpinner inline label={t('metric.chartLoading')} />
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
              {t('metric.records')}
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
                {t('metric.noRecords')}
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
                      {m.value} {localizeUnit(m.unit ?? UNITS[m.metricType])}
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
                <Text style={{ ...Typography.preset.label, color: Colors.primary }}>{t('metric.loadMore')}</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}

      {selectedPetId ? <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel={t('metric.addA11y')} /> : null}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestCloseForm}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader title={t('metric.inputTitle')} back={requestCloseForm} />
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
