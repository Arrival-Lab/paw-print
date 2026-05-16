import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Switch, Alert, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PetSelector from '../features/pet/components/PetSelector';
import { VaccineCard } from '../features/vaccine/components/VaccineCard';
import {
  useVaccines, useCreateVaccine, useDeleteVaccine, useUpdateVaccine,
} from '../features/vaccine/hooks/useVaccines';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Spacing, Typography, Config } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import DateInput from '../shared/components/DateInput';
import ScreenHeader from '../shared/components/ScreenHeader';
import Fab from '../shared/components/Fab';
import Button from '../shared/components/Button';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import type { VaccineRequest } from '../features/vaccine/api/vaccineApi';

const schema = z.object({
  vaccineName: z.string().min(1, '백신명을 입력하세요'),
  vaccinatedAt: z.string().min(1, '접종일을 입력하세요'),
  nextVaccineAt: z.string().optional(),
  notes: z.string().optional(),
  alertEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function DateField({ label, control, name, title, hasError }: any) {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
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
      <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
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

export default function VaccinesScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
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

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vaccineName: '',
      vaccinatedAt: new Date().toISOString().slice(0, 10),
      nextVaccineAt: '',
      notes: '',
      alertEnabled: false,
    },
  });

  const handleCreate = (data: FormValues) => {
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
    update({ vaccineId, data: { vaccineName: '', vaccinatedAt: '', alertEnabled: enabled } });
  };

  const handleDelete = (vaccineId: number) => {
    Alert.alert('삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(vaccineId) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="예방접종 관리" back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : vaccines.length === 0 ? (
        <EmptyState
          icon="shield"
          title="예방접종 기록이 없어요"
          description="첫 백신 일정을 추가해보세요"
          action={{ label: '예방접종 등록', onPress: () => setShowForm(true) }}
        />
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }}
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

      {selectedPetId ? <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel="예방접종 추가" /> : null}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title="예방접종 등록"
            back={() => { setShowForm(false); reset(); }}
            actions={[{ icon: 'check', label: '저장', onPress: handleSubmit(handleCreate) }]}
          />
          <ScrollView contentContainerStyle={{ padding: Spacing.lg }} keyboardShouldPersistTaps="handled">
            <Field label="백신명 *" control={control} name="vaccineName" placeholder="예: 종합백신 (DHPPL)" error={errors.vaccineName} />
            <DateField label="접종일 *" control={control} name="vaccinatedAt" title="접종일" hasError={!!errors.vaccinatedAt} />
            <DateField label="다음 접종 예정일" control={control} name="nextVaccineAt" title="다음 접종 예정일" />
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
    </SafeAreaView>
  );
}
