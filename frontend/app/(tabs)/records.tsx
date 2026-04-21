import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity, Modal, Pressable,
  ActivityIndicator, ScrollView, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Config } from '../../constants';
import PetSelector from '../../features/pet/components/PetSelector';
import RecordCard from '../../features/record/components/RecordCard';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useRecords, useParseOcr } from '../../features/record/hooks/useRecords';
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

const SUB_TABS: { label: string; value: SubTab }[] = [
  { label: '진료기록', value: 'records' },
  { label: '예방접종', value: 'vaccines' },
  { label: '수치 트래킹', value: 'metrics' },
  { label: '먹이·알러지', value: 'food' },
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
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.medium,
        color: Colors.text.secondary, marginBottom: Spacing.xs }}>
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
            placeholderTextColor={Colors.text.disabled}
            style={{ borderWidth: 1, borderColor: error ? Colors.status.error : Colors.border,
              borderRadius: Spacing.borderRadius.md, paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm + 2, fontSize: Typography.size.md, color: Colors.text.primary }}
          />
        )}
      />
      {error && <Text style={{ fontSize: Typography.size.xs, color: Colors.status.error, marginTop: 4 }}>{error.message}</Text>}
    </View>
  );
}

// ── 진료기록 탭 ──────────────────────────────────────────
function RecordsTab({ selectedPetId }: { selectedPetId: number | null }) {
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
      {/* 타임라인 토글 */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
        <TouchableOpacity onPress={() => setIsTimeline((v) => !v)} hitSlop={8}>
          <Feather name={isTimeline ? 'list' : 'clock'} size={20}
            color={isTimeline ? Colors.primary : Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {isTimeline ? (
        <SectionList
          sections={timelineSections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={selectedPetId ? <EmptyState icon="file-text" title="진료기록이 없어요" description="첫 진료기록을 추가해보세요" /> : null}
          renderSectionHeader={({ section: { title } }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.background }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginRight: Spacing.sm }} />
              <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.primary }}>{title}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={{ flexDirection: 'row', paddingLeft: Spacing.lg }}>
              <View style={{ width: 20, alignItems: 'center' }}>
                <View style={{ width: 2, flex: 1, backgroundColor: Colors.border }} />
              </View>
              <View style={{ flex: 1, paddingRight: Spacing.lg, paddingBottom: Spacing.sm }}>
                <RecordCard record={item} onPress={() => router.push({ pathname: '/records/[id]', params: { id: item.id, petId: selectedPetId } })} />
              </View>
            </View>
          )}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.md }} /> : null}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100, flexGrow: 1 }}
          renderItem={({ item }) => (
            <RecordCard record={item} onPress={() => router.push({ pathname: '/records/[id]', params: { id: item.id, petId: selectedPetId } })} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={selectedPetId ? <EmptyState icon="file-text" title="진료기록이 없어요" description="첫 진료기록을 추가해보세요" /> : null}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.md }} /> : null}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowActionSheet(true)}
        style={{ position: 'absolute', bottom: Spacing.xxxl, right: Spacing.lg,
          width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.secondary,
          alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
        <Text style={{ fontSize: 28, color: Colors.text.inverse, lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      {/* ActionSheet */}
      <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={() => setShowActionSheet(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay }} onPress={() => setShowActionSheet(false)}>
          <Pressable>
            <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: Spacing.borderRadius.xl,
              borderTopRightRadius: Spacing.borderRadius.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl }}>
              {[
                { label: '직접 입력', onPress: () => { setShowActionSheet(false); router.push({ pathname: '/records/create', params: { petId: selectedPetId } }); } },
                { label: '처방전 촬영', onPress: () => handleOcr(() => ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaType.Images })) },
                { label: '갤러리에서 선택', onPress: () => handleOcr(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images })) },
              ].map((item) => (
                <TouchableOpacity key={item.label} onPress={item.onPress}
                  style={{ paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl }}>
                  <Text style={{ fontSize: Typography.size.lg, color: Colors.text.primary, textAlign: 'center' }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {ocrLoading && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: Colors.overlay,
          alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
          <LoadingSpinner />
          <Text style={{ fontSize: Typography.size.md, color: Colors.white, fontWeight: Typography.weight.medium }}>
            처방전을 분석 중이에요...
          </Text>
        </View>
      )}
    </View>
  );
}

// ── 예방접종 탭 ──────────────────────────────────────────
function VaccinesTab({ selectedPetId }: { selectedPetId: number | null }) {
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
    defaultValues: { vaccineName: '', vaccinatedAt: new Date().toISOString().slice(0, 10), nextVaccineAt: '', notes: '', alertEnabled: false },
  });

  const handleCreate = (data: VaccineForm) => {
    const payload: VaccineRequest = {
      vaccineName: data.vaccineName, vaccinatedAt: data.vaccinatedAt,
      nextVaccineAt: data.nextVaccineAt || undefined, notes: data.notes || undefined, alertEnabled: data.alertEnabled,
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
    update({ vaccineId, data: { vaccineName: vaccine.vaccineName, vaccinatedAt: vaccine.vaccinatedAt, alertEnabled: enabled } });
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
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xxxl }}>
              <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>등록된 예방접종이 없어요</Text>
            </View>
          }
          renderItem={({ item }) => (
            <VaccineCard vaccine={item} canEnableAlert={canEnableAlert} onToggleAlert={handleToggleAlert} onDelete={handleDelete} />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={{ position: 'absolute', bottom: Spacing.xxxl, right: Spacing.lg,
          width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
          alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
        <Feather name="plus" size={26} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <TouchableOpacity onPress={() => { setShowForm(false); reset(); }}>
              <Text style={{ fontSize: Typography.size.md, color: Colors.text.secondary }}>취소</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: Typography.size.lg,
              fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>예방접종 등록</Text>
            <TouchableOpacity onPress={handleSubmit(handleCreate)} disabled={creating}>
              {creating ? <ActivityIndicator color={Colors.primary} />
                : <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.primary }}>저장</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
            <Field label="백신명 *" control={control} name="vaccineName" placeholder="예: 종합백신 (DHPPL)" error={errors.vaccineName} />
            <Field label="접종일 *" control={control} name="vaccinatedAt" placeholder="YYYY-MM-DD" error={errors.vaccinatedAt} />
            <Field label="다음 접종 예정일" control={control} name="nextVaccineAt" placeholder="YYYY-MM-DD" />
            <Field label="메모" control={control} name="notes" placeholder="이상반응, 병원명 등" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm }}>
              <Text style={{ fontSize: Typography.size.md, color: Colors.text.primary }}>다음 접종 알림</Text>
              <Controller
                control={control} name="alertEnabled"
                render={({ field: { value, onChange } }) => (
                  <Switch value={value} onValueChange={onChange}
                    trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.white} />
                )}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── 수치 트래킹 탭 ───────────────────────────────────────
function MetricsTab({ selectedPetId }: { selectedPetId: number | null }) {
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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 타입 탭 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm }}>
          {METRIC_TABS.map((tab) => (
            <TouchableOpacity key={tab.value} onPress={() => handleTabPress(tab.value)}
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
            <Text style={{ fontSize: Typography.size.xs, color: Colors.primary }}>무료 플랜은 최근 1개월 데이터만 표시됩니다.</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          {chartLoading
            ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
            : <MetricChart data={chartData} unit={UNITS[activeType]} />}
        </View>

        <View style={{ paddingHorizontal: Spacing.lg }}>
          <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
            color: Colors.text.primary, marginBottom: Spacing.md }}>기록</Text>
          {metrics.length === 0 ? (
            <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary, textAlign: 'center', marginTop: Spacing.lg }}>아직 기록이 없어요</Text>
          ) : (
            metrics.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center',
                paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
                    {m.value} {m.unit ?? UNITS[m.metricType]}
                  </Text>
                  <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary, marginTop: 2 }}>{m.measuredAt}</Text>
                </View>
                {m.metricName && (
                  <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary, marginRight: Spacing.md }}>{m.metricName}</Text>
                )}
                <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))
          )}
          {hasNextPage && (
            <TouchableOpacity onPress={() => fetchNextPage()} style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
              <Text style={{ fontSize: Typography.size.sm, color: Colors.primary }}>더 보기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={{ position: 'absolute', bottom: Spacing.xxxl, right: Spacing.lg,
          width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
          alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
        <Feather name="plus" size={26} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={{ fontSize: Typography.size.md, color: Colors.text.secondary }}>취소</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: Typography.size.lg,
              fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>수치 입력</Text>
            <View style={{ width: 40 }} />
          </View>
          <MetricForm
            onSubmit={(data) => create({ ...data, metricName: data.metricName ?? undefined }, { onSuccess: () => setShowForm(false) })}
            loading={creating}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── 먹이·알러지 탭 ──────────────────────────────────────
function FoodTab({ selectedPetId }: { selectedPetId: number | null }) {
  const { data: foodInfo, isLoading } = useFoodInfo(selectedPetId ?? 0);
  const { mutate: upsert, isPending } = useUpsertFood(selectedPetId ?? 0);

  if (!selectedPetId) return null;

  if (isLoading) {
    return <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />;
  }

  return (
    <FoodEditor
      initial={foodInfo}
      onSubmit={(data: FoodInfoRequest) => upsert(data)}
      loading={isPending}
    />
  );
}

// ── 메인 화면 ────────────────────────────────────────────
export default function HealthScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>('records');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary }}>
          건강관리
        </Text>
      </View>

      {/* 서브탭 */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        {SUB_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.value ? Colors.primary : 'transparent' }}>
            <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
              color: activeTab === tab.value ? Colors.primary : Colors.text.tertiary }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {/* 반려동물 미선택 */}
      {!selectedPetId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>반려동물을 선택해주세요</Text>
        </View>
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
