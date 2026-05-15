import React, { useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import PetSelector from '../features/pet/components/PetSelector';
import { VaccineCard } from '../features/vaccine/components/VaccineCard';
import { useVaccines, useUpdateVaccine, useDeleteVaccine } from '../features/vaccine/hooks/useVaccines';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Spacing, Typography, Config } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';

export default function NotificationsScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: vaccines = [], isLoading } = useVaccines(selectedPetId ?? 0);
  const { mutate: update } = useUpdateVaccine(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteVaccine(selectedPetId ?? 0);

  const isFree = user?.subscriptionType === 'FREE';
  const alertEnabledCount = vaccines.filter((v) => v.alertEnabled).length;
  const canEnableAlert = !isFree || alertEnabledCount < Config.freeMaxVaccineAlerts;

  const handleToggleAlert = (vaccineId: number, enabled: boolean) => {
    if (enabled && !canEnableAlert) {
      showPremiumModal(`무료 플랜은 예방접종 알림을 ${Config.freeMaxVaccineAlerts}개까지 설정할 수 있어요.`);
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
      },
    });
  };

  const handleDelete = (vaccineId: number) => {
    Alert.alert('삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(vaccineId) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="알림 설정"
        back
        actions={[{ icon: 'plus', label: '예방접종 등록', onPress: () => router.push('/vaccines') }]}
      />

      <View
        style={{
          marginHorizontal: Spacing.lg,
          marginVertical: Spacing.md,
          backgroundColor: Colors.status.infoBg,
          borderRadius: Spacing.borderRadius.md,
          padding: Spacing.md,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: Spacing.sm,
        }}
      >
        <Feather name="info" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, ...Typography.preset.bodySmall, color: Colors.primaryDark }}>
          예방접종 알림을 켜면 다음 접종일 3일 전에 푸시 알림을 보내드려요.
          {isFree && `\n무료 플랜은 최대 ${Config.freeMaxVaccineAlerts}개까지 알림 설정 가능해요.`}
        </Text>
      </View>

      <View style={{ paddingBottom: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="등록된 예방접종이 없어요"
              description="예방접종을 등록하고 알림을 받아보세요"
              action={{ label: '예방접종 등록하기', onPress: () => router.push('/vaccines') }}
            />
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
    </SafeAreaView>
  );
}
