import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, SectionList, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import i18n from '../../../shared/i18n';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import Fab from '../../../shared/components/Fab';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import RecordCard from './RecordCard';
import RecordCreateSheet from './RecordCreateSheet';
import { useRecords, useAllRecords, useDeleteRecord } from '../hooks/useRecords';
import { recordApi } from '../api/recordApi';
import type { MedicalRecordSummary } from '../api/recordApi';

function daysAgoLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return i18n.t('record.today');
  if (diff === 1) return i18n.t('record.yesterday');
  if (diff < 0) return `D${diff}`;
  return i18n.t('record.daysAgo', { count: diff });
}

function formatYearMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  return i18n.t('record.yearMonth', { year: y, month: Number(m) });
}

function hospitalColor(name: string | null, Colors: ReturnType<typeof useColors>): string {
  if (!name) return Colors.text.tertiary;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    Colors.primary,
    Colors.primaryDark,
    Colors.secondaryDark,
    Colors.status.success,
    Colors.status.warning,
  ];
  return palette[Math.abs(hash) % palette.length];
}

export function RecordsTab({ selectedPetId, topInset = 0 }: { selectedPetId: number | null; topInset?: number }) {
  const Colors = useColors();
  const { t } = useTranslation();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecords(selectedPetId ?? 0);
  const { mutate: deleteRecord } = useDeleteRecord(selectedPetId ?? 0);

  const handleLongPressRecord = (record: MedicalRecordSummary) => {
    Alert.alert(
      t('record.title'),
      record.hospitalName ?? t('record.noHospitalName'),
      [
        { text: t('action.cancel'), style: 'cancel' },
        {
          text: t('action.delete'),
          style: 'destructive',
          onPress: () => {
            deleteRecord(record.id, {
              onError: (e: any) =>
                Alert.alert(t('common.deleteFailTitle'), e?.response?.data?.message ?? t('common.tryAgainLater')),
            });
          },
        },
      ],
    );
  };
  const { refreshing, onRefresh } = useRefresh([['records', selectedPetId ?? 0]]);

  const records: MedicalRecordSummary[] = data?.pages.flatMap((p) => p.content) ?? [];

  const timelineSections = useMemo(() => {
    const map = new Map<string, MedicalRecordSummary[]>();
    records.forEach((r) => {
      const key = r.visitedAt.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([month, data]) => ({ title: month, data }));
  }, [records]);

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <SectionList
        sections={timelineSections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          selectedPetId && records.length === 0 ? (
            <EmptyState
              icon="file-text"
              title={t('record.firstRecordTitle')}
              description={t('record.firstRecordDesc')}
              action={{ label: t('record.autoFillCta'), onPress: () => setShowActionSheet(true) }}
              secondaryAction={{ label: t('record.manualEntryCta'), onPress: () => router.push({ pathname: '/records/create', params: { petId: selectedPetId } }) }}
            />
          ) : selectedPetId ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                textAlign: 'center',
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.xl,
              }}
            >
              {t('record.emptyHintFab')}
            </Text>
          ) : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={{
              paddingHorizontal: Spacing.xl,
              paddingTop: Spacing.lg,
              paddingBottom: Spacing.sm,
              backgroundColor: Colors.surface,
            }}
          >
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary }}>
              {formatYearMonth(title)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const dotColor = hospitalColor(item.hospitalName, Colors);
          return (
            <View style={{ flexDirection: 'row', paddingLeft: Spacing.xl }}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: Colors.border,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: dotColor,
                    marginTop: 16,
                  }}
                />
              </View>
              <View style={{ flex: 1, paddingRight: Spacing.xl, paddingVertical: Spacing.xs }}>
                <Text
                  style={{
                    ...Typography.preset.caption,
                    color: Colors.text.tertiary,
                    marginLeft: 4,
                  }}
                >
                  {daysAgoLabel(item.visitedAt)}
                </Text>
                <RecordCard
                  record={item}
                  hideDate
                  onPress={() =>
                    router.push({ pathname: '/records/[id]', params: { id: item.id, petId: selectedPetId } })
                  }
                  onLongPress={() => handleLongPressRecord(item)}
                />
              </View>
            </View>
          );
        }}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label={t('common.loading')} /> : null}
      />

      <Fab onPress={() => setShowActionSheet(true)} icon="plus" accessibilityLabel={t('record.addTitle')} />

      <RecordCreateSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        petId={selectedPetId}
      />
    </View>
  );
}

export function AllRecordsTab({ topInset = 0 }: { topInset?: number }) {
  const Colors = useColors();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAllRecords();
  const records = data?.pages.flatMap((p) => p.content) ?? [];

  const timelineSections = useMemo(() => {
    const map = new Map<string, typeof records>();
    records.forEach((r) => {
      const key = r.visitedAt.slice(0, 7);
      if (!map.has(key)) map.set(key, [] as typeof records);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([month, data]) => ({ title: month, data }));
  }, [records]);

  const handleLongPress = (item: (typeof records)[number]) => {
    Alert.alert(
      t('record.title'),
      item.hospitalName ?? t('record.noHospitalName'),
      [
        { text: t('action.cancel'), style: 'cancel' },
        {
          text: t('action.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await recordApi.deleteRecord(item.petId, item.id);
              queryClient.invalidateQueries({ queryKey: ['records'] });
            } catch (e: any) {
              Alert.alert(t('common.deleteFailTitle'), e?.response?.data?.message ?? t('common.tryAgainLater'));
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <LoadingSpinner label={t('common.loading')} />
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <EmptyState
          icon="file-text"
          title={t('record.emptyTitle')}
          description={t('record.emptyDescAll')}
          tone="muted"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <SectionList
        sections={timelineSections}
        keyExtractor={(item) => `${item.petId}-${item.id}`}
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={{
              paddingHorizontal: Spacing.xl,
              paddingTop: Spacing.lg,
              paddingBottom: Spacing.sm,
              backgroundColor: Colors.surface,
            }}
          >
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary }}>
              {formatYearMonth(title)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const dotColor = hospitalColor(item.hospitalName, Colors);
          return (
            <View style={{ flexDirection: 'row', paddingLeft: Spacing.xl }}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: Colors.border,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: dotColor,
                    marginTop: 16,
                  }}
                />
              </View>
              <View style={{ flex: 1, paddingRight: Spacing.xl, paddingVertical: Spacing.xs }}>
                <Text
                  style={{
                    ...Typography.preset.caption,
                    color: Colors.text.tertiary,
                    marginLeft: 4,
                  }}
                >
                  {daysAgoLabel(item.visitedAt)}
                </Text>
                <RecordCard
                  record={item}
                  hideDate
                  petName={item.petName}
                  onPress={() =>
                    router.push({ pathname: '/records/[id]', params: { id: item.id, petId: item.petId } })
                  }
                  onLongPress={() => handleLongPress(item)}
                />
              </View>
            </View>
          );
        }}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label={t('common.loading')} /> : null}
      />
    </View>
  );
}
