import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Config } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import Fab from '../../../shared/components/Fab';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Button from '../../../shared/components/Button';
import DateInput from '../../../shared/components/DateInput';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import { useAuthStore } from '../../auth/store/authStore';
import { useUiStore } from '../../../shared/store/uiStore';
import { VaccineCard } from './VaccineCard';
import { useVaccines, useCreateVaccine, useDeleteVaccine, useUpdateVaccine } from '../hooks/useVaccines';
import { scheduleVaccineNotificationPreview } from '../utils/notificationPreview';
import type { RecurrenceType, VaccineRequest } from '../api/vaccineApi';

const vaccineSchema = z.object({
  vaccineName: z.string().min(1, '항목명을 입력하세요'),
  vaccinatedAt: z.string().min(1, '접종/투약일을 입력하세요'),
  nextVaccineAt: z.string().optional(),
  notes: z.string().optional(),
  alertEnabled: z.boolean(),
  recurrenceType: z.enum(['NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
});
type VaccineForm = z.infer<typeof vaccineSchema>;

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; desc: string }[] = [
  { value: 'NONE', label: '단발', desc: '한 번만 — 종합백신·광견병 등' },
  { value: 'MONTHLY', label: '매월', desc: '벼룩약·심장사상충 약' },
  { value: 'QUARTERLY', label: '분기마다', desc: '일부 외용약' },
  { value: 'YEARLY', label: '매년', desc: '연간 종합 검진/접종' },
];

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

export function VaccinesTab({ selectedPetId, topInset = 0 }: { selectedPetId: number | null; topInset?: number }) {
  const Colors = useColors();
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: vaccines = [], isLoading } = useVaccines(selectedPetId ?? 0);
  const { mutate: create, isPending: creating } = useCreateVaccine(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteVaccine(selectedPetId ?? 0);
  const { mutate: update } = useUpdateVaccine(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([['vaccines', selectedPetId ?? 0], ['vaccines', 'upcoming']]);

  const sortedVaccines = useMemo(
    () => [...vaccines].sort((a, b) => (b.vaccinatedAt ?? '').localeCompare(a.vaccinatedAt ?? '')),
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
      recurrenceType: 'NONE',
    },
  });

  const handleCreate = (data: VaccineForm) => {
    const payload: VaccineRequest = {
      vaccineName: data.vaccineName,
      vaccinatedAt: data.vaccinatedAt,
      nextVaccineAt: data.nextVaccineAt || undefined,
      notes: data.notes || undefined,
      alertEnabled: data.alertEnabled,
      recurrenceType: data.recurrenceType,
    };
    create(payload, { onSuccess: () => { setShowForm(false); reset(); } });
  };

  const handleToggleAlert = (vaccineId: number, enabled: boolean) => {
    if (enabled && !canEnableAlert) {
      showPremiumModal(`무료 플랜은 예방접종/정기 케어 알림을 ${Config.freeMaxVaccineAlerts}개까지 설정할 수 있어요.`);
      return;
    }
    const vaccine = vaccines.find((v) => v.id === vaccineId);
    if (!vaccine) return;
    update({
      vaccineId,
      data: {
        vaccineName: vaccine.vaccineName,
        vaccinatedAt: vaccine.vaccinatedAt,
        nextVaccineAt: vaccine.nextVaccineAt ?? undefined,
        notes: vaccine.notes ?? undefined,
        alertEnabled: enabled,
        recurrenceType: vaccine.recurrenceType,
      },
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
            title="백신·정기 약물 일정을 추가해보세요"
            description="단발 백신부터 매월 발라주는 벼룩약까지 — D-3 푸시 알림과 자동 반복으로 챙겨요"
            action={{ label: '항목 추가', onPress: () => setShowForm(true) }}
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

      <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel="백신/정기 케어 추가" />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title="백신·정기 케어 등록"
            back={() => { setShowForm(false); reset(); }}
            actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(handleCreate) }]}
          />
          <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg }} keyboardShouldPersistTaps="handled">
            <Field label="항목명 *" control={control} name="vaccineName" placeholder="예: 종합백신 / 벼룩약 / 심장사상충 약" error={errors.vaccineName} />
            <DateField label="접종/투약일 *" control={control} name="vaccinatedAt" title="접종/투약일" hasError={!!errors.vaccinatedAt} />
            <DateField label="다음 예정일" control={control} name="nextVaccineAt" title="다음 예정일" />

            <Controller
              control={control}
              name="recurrenceType"
              render={({ field: { value, onChange } }) => (
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
                    반복
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                    {RECURRENCE_OPTIONS.map((opt) => {
                      const selected = value === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          activeOpacity={0.8}
                          style={{
                            paddingHorizontal: Spacing.md,
                            paddingVertical: Spacing.sm,
                            borderRadius: Spacing.borderRadius.full,
                            backgroundColor: selected ? Colors.primaryDark : Colors.surface,
                            borderWidth: 1,
                            borderColor: selected ? Colors.primaryDark : Colors.border,
                          }}
                        >
                          <Text
                            style={{
                              ...Typography.preset.caption,
                              color: selected ? Colors.white : Colors.text.primary,
                              fontWeight: Typography.weight.semibold,
                            }}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.xs }}>
                    {RECURRENCE_OPTIONS.find((o) => o.value === value)?.desc ?? ''}
                    {value !== 'NONE' ? ' · 알림 받은 날 자동으로 다음 일정이 잡혀요.' : ''}
                  </Text>
                </View>
              )}
            />


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
                      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>다음 일정 알림</Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        예정일 D-7·D-3·D-1·D-0 푸시 알림
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
