import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity, Modal,
  ScrollView, TextInput, Switch, Alert, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Config } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import GlassHeader from '../../shared/components/GlassHeader';
import Chip from '../../shared/components/Chip';
import Fab from '../../shared/components/Fab';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import DateInput from '../../shared/components/DateInput';
import { useRefresh } from '../../shared/hooks/useRefresh';
import PetSelector from '../../features/pet/components/PetSelector';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';
import RecordCard from '../../features/record/components/RecordCard';
import RecordCreateSheet from '../../features/record/components/RecordCreateSheet';
import { useRecords, useAllRecords, useDeleteRecord } from '../../features/record/hooks/useRecords';
import { scheduleVaccineNotificationPreview } from '../../features/vaccine/utils/notificationPreview';
import { usePets } from '../../features/pet/hooks/usePets';
import { VaccineCard } from '../../features/vaccine/components/VaccineCard';
import { CareTab } from '../../features/care/components/CareTab';
import { MedicalTab, AllMedicalTab } from '../../features/medical/components/MedicalTab';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import {
  useVaccines, useCreateVaccine, useDeleteVaccine, useUpdateVaccine,
} from '../../features/vaccine/hooks/useVaccines';
import { MetricChart } from '../../features/metric/components/MetricChart';
import { MetricForm } from '../../features/metric/components/MetricForm';
import {
  useMetricChart, useMetrics, useCreateMetric, useDeleteMetric,
} from '../../features/metric/hooks/useMetrics';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUiStore } from '../../shared/store/uiStore';
import { recordApi } from '../../features/record/api/recordApi';
import { useQueryClient } from '@tanstack/react-query';
import type { MedicalRecordSummary } from '../../features/record/api/recordApi';
import type { MetricType, MetricRequest } from '../../features/metric/api/metricApi';
import type { VaccineRequest } from '../../features/vaccine/api/vaccineApi';

type SubTab = 'daily' | 'medical' | 'vaccines' | 'metrics';

// 타임라인 helper ────────────────────────────────────────
function daysAgoLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 0) return `D${diff}`;
  return `${diff}일 전`;
}

function formatYearMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  return `${y}년 ${Number(m)}월`;
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

const SUB_TABS: { label: string; value: SubTab; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { label: '일상', value: 'daily', icon: 'check-square' },
  { label: '진료', value: 'medical', icon: 'heart' },
  { label: '백신', value: 'vaccines', icon: 'shield' },
  { label: '수치', value: 'metrics', icon: 'trending-up' },
];

/** 구버전 deeplink 호환 — tab=records, tab=appointments → tab=medical 로 리매핑. */
const LEGACY_TAB_MAP: Record<string, SubTab> = {
  records: 'medical',
  appointments: 'medical',
};

const METRIC_TABS: { label: string; value: MetricType }[] = [
  { label: '체중', value: 'WEIGHT' },
  { label: 'BUN', value: 'BUN' },
  { label: '크레아티닌', value: 'CREATININE' },
  { label: '직접입력', value: 'CUSTOM' },
];

const UNITS: Record<MetricType, string> = {
  WEIGHT: 'kg', BUN: 'mg/dL', CREATININE: 'mg/dL', CUSTOM: '',
};

const vaccineSchema = z.object({
  vaccineName: z.string().min(1, '백신명을 입력하세요'),
  vaccinatedAt: z.string().min(1, '접종일을 입력하세요'),
  nextVaccineAt: z.string().optional(),
  notes: z.string().optional(),
  alertEnabled: z.boolean(),
});
type VaccineForm = z.infer<typeof vaccineSchema>;

function DateField({ label, control, name, title, hasError }: any) {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text
        style={{
          ...Typography.preset.label,
          color: Colors.text.secondary,
          marginBottom: Spacing.xs,
        }}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <DateInput value={value} onChange={onChange} title={title ?? label} hasError={hasError} />
        )}
      />
    </View>
  );
}

function Field({ label, control, name, placeholder, error }: any) {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text
        style={{
          ...Typography.preset.label,
          color: Colors.text.secondary,
          marginBottom: Spacing.xs,
        }}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.tertiary}
            style={{
              borderWidth: 1,
              borderColor: error ? Colors.status.error : Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: 12,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              backgroundColor: Colors.white,
            }}
          />
        )}
      />
      {error && (
        <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: 4 }}>
          {error.message}
        </Text>
      )}
    </View>
  );
}

// ── 진료기록 탭 ──────────────────────────────────────────
// /records/all 풀리스트 라우트에서 재활용 — named export.
export function RecordsTab({ selectedPetId, topInset = 0 }: { selectedPetId: number | null; topInset?: number }) {
  const Colors = useColors();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecords(selectedPetId ?? 0);
  const { mutate: deleteRecord } = useDeleteRecord(selectedPetId ?? 0);

  const handleLongPressRecord = (record: MedicalRecordSummary) => {
    Alert.alert(
      '진료기록',
      record.hospitalName ?? '병원명 없음',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteRecord(record.id, {
              onError: (e: any) =>
                Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.'),
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
              title="첫 진료기록을 남겨보세요"
              description="영수증·처방전 사진 한 장이면 AI가 자동으로 채워줘요"
              action={{ label: '✨ AI로 자동 입력', onPress: () => setShowActionSheet(true) }}
              secondaryAction={{ label: '직접 입력하기', onPress: () => router.push({ pathname: '/records/create', params: { petId: selectedPetId } }) }}
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
              아직 진료기록이 없어요 — + 버튼으로 추가해보세요
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
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label="불러오는 중" /> : null}
      />

      <Fab onPress={() => setShowActionSheet(true)} icon="plus" accessibilityLabel="진료기록 추가" />

      <RecordCreateSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        petId={selectedPetId}
      />
    </View>
  );
}



// ── 예방접종 탭 ──────────────────────────────────────────
function VaccinesTab({ selectedPetId, topInset = 0 }: { selectedPetId: number | null; topInset?: number }) {
  const Colors = useColors();
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: vaccines = [], isLoading } = useVaccines(selectedPetId ?? 0);
  const { mutate: create, isPending: creating } = useCreateVaccine(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteVaccine(selectedPetId ?? 0);
  const { mutate: update } = useUpdateVaccine(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([['vaccines', selectedPetId ?? 0], ['vaccines', 'upcoming']]);

  // 최근 접종 순(내림차순). 백엔드 정렬에 의존하지 않고 프론트에서 한 번 더 보장.
  const sortedVaccines = useMemo(
    () => [...(vaccines as any[])].sort((a, b) => (b.vaccinatedAt ?? '').localeCompare(a.vaccinatedAt ?? '')),
    [vaccines],
  );

  const alertEnabledCount = vaccines.filter((v) => v.alertEnabled).length;
  const isFree = user?.subscriptionType === 'FREE';
  const canEnableAlert = !isFree || alertEnabledCount < Config.freeMaxVaccineAlerts;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<VaccineForm>({
    resolver: zodResolver(vaccineSchema),
    defaultValues: {
      vaccineName: '',
      vaccinatedAt: new Date().toISOString().slice(0, 10),
      nextVaccineAt: '',
      notes: '',
      alertEnabled: false,
    },
  });

  const handleCreate = (data: VaccineForm) => {
    const payload: VaccineRequest = {
      vaccineName: data.vaccineName,
      vaccinatedAt: data.vaccinatedAt,
      nextVaccineAt: data.nextVaccineAt || undefined,
      notes: data.notes || undefined,
      alertEnabled: data.alertEnabled,
    };
    create(payload, { onSuccess: () => { setShowForm(false); reset(); } });
  };

  const handleToggleAlert = (vaccineId: number, enabled: boolean) => {
    if (enabled && !canEnableAlert) {
      showPremiumModal(`무료 플랜은 예방접종 알림을 ${Config.freeMaxVaccineAlerts}개까지 설정할 수 있어요.`);
      return;
    }
    const vaccine = vaccines.find((v) => v.id === vaccineId);
    if (!vaccine) return;
    update({
      vaccineId,
      data: { vaccineName: vaccine.vaccineName, vaccinatedAt: vaccine.vaccinatedAt, alertEnabled: enabled },
    });
  };

  const handleDelete = (vaccineId: number) => {
    Alert.alert('삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(vaccineId) },
    ]);
  };

  if (!selectedPetId) return null;

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <View style={{ flex: 1, paddingTop: topInset }}>
          <LoadingSpinner label="불러오는 중" />
        </View>
      ) : vaccines.length === 0 ? (
        <View style={{ flex: 1, paddingTop: topInset }}>
          <EmptyState
            icon="shield"
            title="예방접종 일정을 추가해보세요"
            description="다음 접종일을 등록하면 D-3에 푸시 알림이 와요"
            action={{ label: '백신 추가', onPress: () => setShowForm(true) }}
          />
        </View>
      ) : (
        <FlatList
          data={sortedVaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: topInset + Spacing.lg, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListHeaderComponent={
            isFree ? (
              <View style={{ marginBottom: Spacing.lg, paddingHorizontal: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    활성 알림
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
                    {alertEnabledCount}/{Config.freeMaxVaccineAlerts}개
                  </Text>
                </View>
                <View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: Colors.border,
                    marginTop: Spacing.xs,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(100, (alertEnabledCount / Config.freeMaxVaccineAlerts) * 100)}%`,
                      height: '100%',
                      backgroundColor: Colors.primary,
                    }}
                  />
                </View>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
          renderItem={({ item }) => (
            <VaccineCard
              vaccine={item}
              canEnableAlert={canEnableAlert}
              onToggleAlert={handleToggleAlert}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel="예방접종 추가" />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title="예방접종 등록"
            back={() => { setShowForm(false); reset(); }}
            actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(handleCreate) }]}
          />
          <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg }} keyboardShouldPersistTaps="handled">
            <Field label="백신명 *" control={control} name="vaccineName" placeholder="예: 종합백신 (DHPPL)" error={errors.vaccineName} />
            <DateField label="접종일 *" control={control} name="vaccinatedAt" title="접종일" hasError={!!errors.vaccinatedAt} />
            <DateField label="다음 접종 예정일" control={control} name="nextVaccineAt" title="다음 접종 예정일" />
            <Field label="메모" control={control} name="notes" placeholder="이상반응, 병원명 등" />
            <Controller
              control={control}
              name="alertEnabled"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    marginTop: Spacing.md,
                    padding: Spacing.md,
                    backgroundColor: Colors.surface,
                    borderRadius: Spacing.borderRadius.md,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    gap: value ? Spacing.sm : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>다음 접종 알림</Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        예정일 D-3에 푸시 알림
                      </Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.white}
                    />
                  </View>
                  {value ? (
                    <TouchableOpacity
                      onPress={async () => {
                        const name = (control._formValues?.vaccineName as string) || '백신';
                        const ok = await scheduleVaccineNotificationPreview(name);
                        if (ok) Alert.alert('5초 뒤 알려드릴게요', '미리보기 알림이 발송돼요.');
                      }}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: Spacing.borderRadius.md,
                        backgroundColor: Colors.primaryLight,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Feather name="bell" size={12} color={Colors.primaryDark} />
                      <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
                        지금 미리보기 알림 받기
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            />
            <View style={{ height: Spacing.xl }} />
            <Button fullWidth size="lg" loading={creating} onPress={handleSubmit(handleCreate)}>
              저장
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── 수치 트래킹 탭 ───────────────────────────────────────
function MetricsTab({ selectedPetId, topInset = 0 }: { selectedPetId: number | null; topInset?: number }) {
  const Colors = useColors();
  const [activeType, setActiveType] = useState<MetricType>('WEIGHT');
  const [showForm, setShowForm] = useState(false);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
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
  const { refreshing, onRefresh } = useRefresh([
    ['metrics', selectedPetId ?? 0, activeType],
    ['metric-chart', selectedPetId ?? 0, activeType],
  ]);

  const metrics = metricsData?.pages.flatMap((p) => p.content) ?? [];

  const handleDelete = (id: number) => {
    Alert.alert('삭제', '이 수치를 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  const handleTabPress = (type: MetricType) => {
    if (isFree && type !== 'WEIGHT') {
      showPremiumModal('프리미엄 구독 시 모든 수치 항목을 무제한으로 기록할 수 있어요.');
    }
    setActiveType(type);
  };

  if (!selectedPetId) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressViewOffset={topInset} />
        }
      >
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
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: Spacing.xl,
              marginBottom: Spacing.sm,
            }}
          >
            <Feather name="info" size={11} color={Colors.text.tertiary} />
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
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
              unit={UNITS[activeType]}
              width={Dimensions.get('window').width - Spacing.xl * 2}
              onPointPress={(measuredAt) => {
                setHighlightDate(measuredAt);
                // 3초 후 자동 해제 — 사용자가 다른 점 누르면 즉시 갱신됨.
                setTimeout(() => setHighlightDate((curr) => (curr === measuredAt ? null : curr)), 3000);
              }}
            />
          )}
        </View>

        <View style={{ paddingHorizontal: Spacing.xl }}>
          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.text.tertiary,
              fontWeight: Typography.weight.semibold,
              letterSpacing: 0.4,
              marginBottom: Spacing.xs,
            }}
          >
            기록
          </Text>
          {metrics.length === 0 ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                textAlign: 'center',
                paddingVertical: Spacing.xl,
              }}
            >
              아직 기록이 없어요
            </Text>
          ) : (
            metrics.map((m, idx) => {
              const isHighlighted = highlightDate === m.measuredAt;
              return (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: Spacing.md,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: Colors.border,
                    backgroundColor: isHighlighted ? Colors.primaryLight : 'transparent',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.body, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
                      {m.value} {m.unit ?? UNITS[m.metricType]}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                      {m.measuredAt}
                    </Text>
                  </View>
                  {m.metricName ? (
                    <Text
                      style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginRight: Spacing.md }}
                    >
                      {m.metricName}
                    </Text>
                  ) : null}
                  <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={Spacing.hitSlop}>
                    <Feather name="trash-2" size={14} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          {hasNextPage && (
            <TouchableOpacity onPress={() => fetchNextPage()} style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
              <Text style={{ ...Typography.preset.label, color: Colors.primary }}>더 보기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel="수치 추가" />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader title="수치 입력" back={() => setShowForm(false)} />
          <MetricForm
            onSubmit={(data) =>
              create({ ...data, metricName: data.metricName ?? undefined }, { onSuccess: () => setShowForm(false) })
            }
            loading={creating}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── 먹이 탭 ──────────────────────────────────────────
// ── 메인 ─────────────────────────────────────────────
export default function HealthScreen() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const params = useLocalSearchParams<{ tab?: string }>();
  const resolveTab = (raw: string | undefined): SubTab | null => {
    if (!raw) return null;
    if (SUB_TABS.some((t) => t.value === raw)) return raw as SubTab;
    if (LEGACY_TAB_MAP[raw]) return LEGACY_TAB_MAP[raw];
    return null;
  };
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>(resolveTab(params.tab) ?? 'daily');
  const setSelectedPetIdStore = usePetFilterStore((s) => s.setSelectedPetId);
  const { data: pets, isLoading: petsLoading } = usePets();
  const noPets = !petsLoading && (pets?.length ?? 0) === 0;

  // deep link 로 들어온 경우 (예: /records?tab=daily) tab state 동기화
  useEffect(() => {
    const next = resolveTab(params.tab);
    if (next) setActiveTab(next);
  }, [params.tab]);

  // 일상(케어)·수치·백신은 펫별 관리 — pet 선택을 store에도 sync
  useEffect(() => {
    if (selectedPetId !== null) setSelectedPetIdStore(selectedPetId);
  }, [selectedPetId, setSelectedPetIdStore]);

  if (noPets) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="book-open"
            title="기록은 펫 등록 후 시작해요"
            description="일상 케어·진료·예방접종·수치까지 한 곳에서 관리해요"
            action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
          />
        </View>
        <GlassHeader title="기록" onHeightChange={setHeaderHeight} />
      </View>
    );
  }

  // '일상'·'백신'·'수치' 는 펫별로만 의미 있는 화면 → "전체" 칩 숨김.
  // '진료' 만 "전체" 모드 지원 (AllMedicalTab 으로 모든 펫 일정/기록 머지).
  const includeAllPets = activeTab === 'medical';

  const subTabBar = (
      <TourTarget
        tourId={TOUR_TARGETS.TAB_RECORDS}
        wrap
        style={{
          flexDirection: 'row',
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing.sm,
        }}
      >
        {SUB_TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: Spacing.md,
              }}
            >
              <Feather name={tab.icon} size={18} color={active ? Colors.primary : Colors.text.tertiary} />
              <Text
                style={{
                  ...Typography.preset.caption,
                  fontWeight: Typography.weight.semibold,
                  color: active ? Colors.primary : Colors.text.tertiary,
                  marginTop: 4,
                }}
              >
                {tab.label}
              </Text>
              {active ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    width: 24,
                    height: 3,
                    backgroundColor: Colors.primary,
                    borderRadius: 2,
                  }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </TourTarget>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        {selectedPetId === null && activeTab === 'medical' ? (
          <AllMedicalTab topInset={headerHeight} />
        ) : selectedPetId === null ? (
          <View style={{ flex: 1, paddingTop: headerHeight }}>
            <EmptyState
              icon={activeTab === 'daily' ? 'check-square' : 'heart'}
              title="펫을 선택해주세요"
              description={
                activeTab === 'daily'
                  ? '케어는 펫별로 관리해요. 상단에서 펫을 선택하세요'
                  : activeTab === 'vaccines'
                  ? '예방접종은 펫별로 관리해요. 상단에서 펫을 선택하세요'
                  : '수치 트래킹은 펫별로 표시돼요. 상단에서 펫을 선택하세요'
              }
              tone="muted"
            />
          </View>
        ) : (
          <>
            {activeTab === 'daily' && <CareTab selectedPetId={selectedPetId} topInset={headerHeight} />}
            {activeTab === 'medical' && <MedicalTab selectedPetId={selectedPetId} topInset={headerHeight} />}
            {activeTab === 'vaccines' && <VaccinesTab selectedPetId={selectedPetId} topInset={headerHeight} />}
            {activeTab === 'metrics' && <MetricsTab selectedPetId={selectedPetId} topInset={headerHeight} />}
          </>
        )}
      </View>

      <GlassHeader title="기록" onHeightChange={setHeaderHeight} bottomSlot={subTabBar}>
        <PetSelector
          onPetChange={setSelectedPetId}
          includeAll={includeAllPets}
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </GlassHeader>
    </View>
  );
}

export function AllRecordsTab({ topInset = 0 }: { topInset?: number }) {
  const Colors = useColors();
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
      '진료기록',
      item.hospitalName ?? '병원명 없음',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await recordApi.deleteRecord(item.petId, item.id);
              queryClient.invalidateQueries({ queryKey: ['records'] });
            } catch (e: any) {
              Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <LoadingSpinner label="불러오는 중" />
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <EmptyState
          icon="file-text"
          title="진료기록이 없어요"
          description="펫을 선택하고 우측 하단 + 버튼으로 추가해보세요"
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
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label="불러오는 중" /> : null}
      />
    </View>
  );
}
