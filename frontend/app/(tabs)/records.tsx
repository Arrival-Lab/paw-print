import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity, Modal, Pressable,
  ScrollView, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Config, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Chip from '../../shared/components/Chip';
import Fab from '../../shared/components/Fab';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import PetSelector from '../../features/pet/components/PetSelector';
import RecordCard from '../../features/record/components/RecordCard';
import { useRecords, useAllRecords, useParseOcr } from '../../features/record/hooks/useRecords';
import { usePets } from '../../features/pet/hooks/usePets';
import { VaccineCard } from '../../features/vaccine/components/VaccineCard';
import { FoodEditor } from '../../features/food/components/FoodEditor';
import { useFoodInfo, useUpsertFood } from '../../features/food/hooks/useFood';
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
import type { MedicalRecordSummary } from '../../features/record/api/recordApi';
import type { MetricType, MetricRequest } from '../../features/metric/api/metricApi';
import type { VaccineRequest } from '../../features/vaccine/api/vaccineApi';
import type { FoodInfoRequest } from '../../features/food/api/foodApi';

type SubTab = 'records' | 'vaccines' | 'metrics' | 'food';

const SUB_TABS: { label: string; value: SubTab; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { label: '진료기록', value: 'records', icon: 'file-text' },
  { label: '예방접종', value: 'vaccines', icon: 'shield' },
  { label: '수치', value: 'metrics', icon: 'trending-up' },
  { label: '먹이', value: 'food', icon: 'coffee' },
];

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
function RecordsTab({ selectedPetId }: { selectedPetId: number | null }) {
  const Colors = useColors();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isTimeline, setIsTimeline] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useRecords(selectedPetId ?? 0);
  const parseOcr = useParseOcr();

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

  const handleOcr = async (launchFn: () => Promise<ImagePicker.ImagePickerResult>) => {
    setShowActionSheet(false);
    const result = await launchFn();
    if (result.canceled || !result.assets?.[0]) return;
    setOcrLoading(true);
    try {
      const ocr = await parseOcr.mutateAsync(result.assets[0].uri);
      router.push({ pathname: '/records/create', params: { petId: selectedPetId, ocr: JSON.stringify(ocr) } });
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {records.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => setIsTimeline((v) => !v)}
            hitSlop={Spacing.hitSlop}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.xs,
              paddingHorizontal: Spacing.md,
              paddingVertical: 6,
              borderRadius: Spacing.borderRadius.full,
              backgroundColor: Colors.primaryLight,
            }}
          >
            <Feather name={isTimeline ? 'list' : 'clock'} size={14} color={Colors.primary} />
            <Text style={{ ...Typography.preset.caption, color: Colors.primary }}>
              {isTimeline ? '리스트' : '타임라인'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isTimeline ? (
        <SectionList
          sections={timelineSections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            selectedPetId ? (
              <EmptyState
                icon="file-text"
                title="진료기록이 없어요"
                description="우측 하단 + 버튼으로 첫 기록을 추가해보세요"
              />
            ) : null
          }
          renderSectionHeader={({ section: { title } }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: Spacing.lg,
                paddingTop: Spacing.lg,
                paddingBottom: Spacing.sm,
                backgroundColor: Colors.background,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.primary,
                  marginRight: Spacing.sm,
                }}
              />
              <Text style={{ ...Typography.preset.label, color: Colors.primary }}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', paddingLeft: Spacing.lg }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <View style={{ width: 2, flex: 1, backgroundColor: Colors.border }} />
              </View>
              <View style={{ flex: 1, paddingRight: Spacing.lg, paddingBottom: Spacing.sm }}>
                <RecordCard
                  record={item}
                  onPress={() =>
                    router.push({ pathname: '/records/[id]', params: { id: item.id, petId: selectedPetId } })
                  }
                />
              </View>
            </View>
          )}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label="불러오는 중" /> : null}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120, flexGrow: 1 }}
          renderItem={({ item }) => (
            <RecordCard
              record={item}
              onPress={() =>
                router.push({ pathname: '/records/[id]', params: { id: item.id, petId: selectedPetId } })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            selectedPetId ? (
              <EmptyState
                icon="file-text"
                title="진료기록이 없어요"
                description="우측 하단 + 버튼으로 첫 기록을 추가해보세요"
              />
            ) : null
          }
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label="불러오는 중" /> : null}
        />
      )}

      <Fab onPress={() => setShowActionSheet(true)} icon="plus" accessibilityLabel="진료기록 추가" />

      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
        statusBarTranslucent
      >
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay }}
          onPress={() => setShowActionSheet(false)}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: Colors.white,
                borderTopLeftRadius: Spacing.borderRadius.xxl,
                borderTopRightRadius: Spacing.borderRadius.xxl,
                paddingTop: Spacing.md,
                paddingBottom: Spacing.xxxxl,
                ...Elevation.modal,
              }}
            >
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
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
                  marginBottom: Spacing.lg,
                }}
              >
                진료기록 추가
              </Text>
              {[
                { icon: 'edit-3' as const, label: '직접 입력', desc: '메모처럼 빠르게', onPress: () => { setShowActionSheet(false); router.push({ pathname: '/records/create', params: { petId: selectedPetId } }); } },
                { icon: 'camera' as const, label: '처방전 촬영', desc: '사진 한 장으로 자동 입력', onPress: () => handleOcr(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'] })) },
                { icon: 'image' as const, label: '갤러리에서 선택', desc: '기존 사진으로 분석', onPress: () => handleOcr(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] })) },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    paddingHorizontal: Spacing.xl,
                    paddingVertical: Spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name={item.icon} size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{item.label}</Text>
                    <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 2 }}>
                      {item.desc}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {ocrLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.md,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.white,
              padding: Spacing.xxl,
              borderRadius: Spacing.borderRadius.xl,
              alignItems: 'center',
              gap: Spacing.md,
              ...Elevation.modal,
            }}
          >
            <LoadingSpinner label="처방전을 분석 중이에요" />
          </View>
        </View>
      )}
    </View>
  );
}

// ── 예방접종 탭 ──────────────────────────────────────────
function VaccinesTab({ selectedPetId }: { selectedPetId: number | null }) {
  const Colors = useColors();
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: vaccines = [], isLoading } = useVaccines(selectedPetId ?? 0);
  const { mutate: create, isPending: creating } = useCreateVaccine(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteVaccine(selectedPetId ?? 0);
  const { mutate: update } = useUpdateVaccine(selectedPetId ?? 0);

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
        <LoadingSpinner label="불러오는 중" />
      ) : vaccines.length === 0 ? (
        <EmptyState
          icon="shield"
          title="예방접종 기록이 없어요"
          description="우측 하단 + 버튼으로 백신 일정을 추가해보세요"
        />
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
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
          <ScrollView contentContainerStyle={{ padding: Spacing.lg }} keyboardShouldPersistTaps="handled">
            <Field label="백신명 *" control={control} name="vaccineName" placeholder="예: 종합백신 (DHPPL)" error={errors.vaccineName} />
            <Field label="접종일 *" control={control} name="vaccinatedAt" placeholder="YYYY-MM-DD" error={errors.vaccinatedAt} />
            <Field label="다음 접종 예정일" control={control} name="nextVaccineAt" placeholder="YYYY-MM-DD" />
            <Field label="메모" control={control} name="notes" placeholder="이상반응, 병원명 등" />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: Spacing.md,
                padding: Spacing.md,
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.md,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>다음 접종 알림</Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  예정일 D-3에 푸시 알림
                </Text>
              </View>
              <Controller
                control={control}
                name="alertEnabled"
                render={({ field: { value, onChange } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                )}
              />
            </View>
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
function MetricsTab({ selectedPetId }: { selectedPetId: number | null }) {
  const Colors = useColors();
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

  const { data: chartData = [], isLoading: chartLoading } = useMetricChart(selectedPetId ?? 0, activeType, from, to);
  const { data: metricsData, fetchNextPage, hasNextPage } = useMetrics(selectedPetId ?? 0, activeType);
  const { mutate: create, isPending: creating } = useCreateMetric(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteMetric(selectedPetId ?? 0);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
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

        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          {chartLoading ? (
            <LoadingSpinner inline label="차트 그리는 중" />
          ) : (
            <MetricChart data={chartData} unit={UNITS[activeType]} />
          )}
        </View>

        <View style={{ paddingHorizontal: Spacing.lg }}>
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.md }}>기록</Text>
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
                <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={Spacing.hitSlop}>
                  <Feather name="trash-2" size={16} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))
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
function FoodTab({ selectedPetId }: { selectedPetId: number | null }) {
  const { data: foodInfo, isLoading } = useFoodInfo(selectedPetId ?? 0);
  const { mutate: upsert, isPending } = useUpsertFood(selectedPetId ?? 0);

  if (!selectedPetId) return null;
  if (isLoading) return <LoadingSpinner label="불러오는 중" />;

  return <FoodEditor initial={foodInfo} onSubmit={(data: FoodInfoRequest) => upsert(data)} loading={isPending} />;
}

// ── 메인 ─────────────────────────────────────────────
export default function HealthScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>('records');
  const { data: pets, isLoading: petsLoading } = usePets();
  const noPets = !petsLoading && (pets?.length ?? 0) === 0;

  if (noPets) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
        <ScreenHeader title="건강관리" />
        <EmptyState
          icon="activity"
          title="건강관리는 펫 등록 후 시작해요"
          description="진료기록·예방접종·수치 트래킹·먹이까지 한 번에 관리해요"
          action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="건강관리" />

      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
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
      </View>

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {selectedPetId === null && activeTab === 'records' ? (
        <AllRecordsTab />
      ) : selectedPetId === null ? (
        <EmptyState
          icon="heart"
          title="펫을 선택해주세요"
          description={
            activeTab === 'vaccines'
              ? '예방접종은 펫별로 관리해요. 상단에서 펫을 선택하세요'
              : activeTab === 'metrics'
                ? '수치 트래킹은 펫별로 표시돼요. 상단에서 펫을 선택하세요'
                : '먹이 정보는 펫별로 관리해요. 상단에서 펫을 선택하세요'
          }
          tone="muted"
        />
      ) : (
        <>
          {activeTab === 'records' && <RecordsTab selectedPetId={selectedPetId} />}
          {activeTab === 'vaccines' && <VaccinesTab selectedPetId={selectedPetId} />}
          {activeTab === 'metrics' && <MetricsTab selectedPetId={selectedPetId} />}
          {activeTab === 'food' && <FoodTab selectedPetId={selectedPetId} />}
        </>
      )}
    </SafeAreaView>
  );
}

function AllRecordsTab() {
  const Colors = useColors();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAllRecords();
  const records = data?.pages.flatMap((p) => p.content) ?? [];

  if (isLoading) return <LoadingSpinner label="불러오는 중" />;

  if (records.length === 0) {
    return (
      <EmptyState
        icon="file-text"
        title="진료기록이 없어요"
        description="펫을 선택하고 우측 하단 + 버튼으로 추가해보세요"
        tone="muted"
      />
    );
  }

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => `${item.petId}-${item.id}`}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 120, gap: Spacing.sm }}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.3}
      ListFooterComponent={isFetchingNextPage ? <LoadingSpinner inline label="불러오는 중" /> : null}
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/records/[id]', params: { id: item.id, petId: item.petId } })
          }
          style={{
            backgroundColor: Colors.white,
            borderRadius: Spacing.borderRadius.lg,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.primary, fontWeight: Typography.weight.semibold }}>
              {item.petName}
            </Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginLeft: Spacing.sm }}>
              {item.visitedAt}
            </Text>
          </View>
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary }} numberOfLines={1}>
            {item.hospitalName ?? '병원 미입력'}
          </Text>
          {item.symptoms ? (
            <Text
              style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 4 }}
              numberOfLines={2}
            >
              {item.symptoms}
            </Text>
          ) : null}
        </TouchableOpacity>
      )}
    />
  );
}
