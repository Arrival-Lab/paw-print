import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  Switch, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
import { Colors, Spacing, Typography } from '../constants';
import { Config } from '../constants';
import type { VaccineRequest } from '../features/vaccine/api/vaccineApi';

const schema = z.object({
  vaccineName: z.string().min(1, '백신명을 입력하세요'),
  vaccinatedAt: z.string().min(1, '접종일을 입력하세요'),
  nextVaccineAt: z.string().optional(),
  notes: z.string().optional(),
  alertEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

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

export default function VaccinesScreen() {
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
    create(payload, {
      onSuccess: () => {
        setShowForm(false);
        reset();
      },
    });
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
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          예방접종 관리
        </Text>
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {/* 목록 */}
      {!selectedPetId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
            반려동물을 선택해주세요
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xxxl }}>
              <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
                등록된 예방접종이 없어요
              </Text>
            </View>
          }
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

      {/* FAB */}
      {selectedPetId && (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{ position: 'absolute', bottom: Spacing.xxxl, right: Spacing.lg,
            width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
            alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
          <Feather name="plus" size={26} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* 등록 모달 */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-background">
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <TouchableOpacity onPress={() => { setShowForm(false); reset(); }}>
              <Text style={{ fontSize: Typography.size.md, color: Colors.text.secondary }}>취소</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: Typography.size.lg,
              fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
              예방접종 등록
            </Text>
            <TouchableOpacity onPress={handleSubmit(handleCreate)} disabled={creating}>
              {creating
                ? <ActivityIndicator color={Colors.primary} />
                : <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
                    color: Colors.primary }}>저장</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
            <Field label="백신명 *" control={control} name="vaccineName"
              placeholder="예: 종합백신 (DHPPL)" error={errors.vaccineName} />
            <Field label="접종일 *" control={control} name="vaccinatedAt"
              placeholder="YYYY-MM-DD" error={errors.vaccinatedAt} />
            <Field label="다음 접종 예정일" control={control} name="nextVaccineAt"
              placeholder="YYYY-MM-DD" />
            <Field label="메모" control={control} name="notes"
              placeholder="이상반응, 병원명 등" />

            <View style={{ flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', marginTop: Spacing.sm }}>
              <Text style={{ fontSize: Typography.size.md, color: Colors.text.primary }}>
                다음 접종 알림
              </Text>
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
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
