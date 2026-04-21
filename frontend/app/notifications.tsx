import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { VaccineCard } from '../features/vaccine/components/VaccineCard';
import { useVaccines, useUpdateVaccine, useDeleteVaccine } from '../features/vaccine/hooks/useVaccines';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Colors, Spacing, Typography, Config } from '../constants';

export default function NotificationsScreen() {
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
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          알림 설정
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/vaccines')}
          hitSlop={8}>
          <Feather name="plus" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 안내 */}
      <View style={{ backgroundColor: Colors.primaryLight, margin: Spacing.lg,
        borderRadius: Spacing.borderRadius.lg, padding: Spacing.md }}>
        <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary }}>
          예방접종 알림을 켜면 다음 접종일 3일 전에 푸시 알림을 보내드려요.
          {isFree && `\n무료 플랜은 최대 ${Config.freeMaxVaccineAlerts}개까지 알림 설정 가능해요.`}
        </Text>
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingBottom: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

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
              <TouchableOpacity
                onPress={() => router.push('/vaccines')}
                style={{ marginTop: Spacing.md }}>
                <Text style={{ color: Colors.primary, fontSize: Typography.size.sm,
                  fontWeight: Typography.weight.semibold }}>
                  예방접종 등록하기
                </Text>
              </TouchableOpacity>
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
    </SafeAreaView>
  );
}
