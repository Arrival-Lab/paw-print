import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator,
  FlatList, Share, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { useShareMembers, useInvite, useRemoveMember } from '../features/share/hooks/useShare';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Colors, Spacing, Typography, Config } from '../constants';
import type { ShareMember } from '../features/share/api/shareApi';

export default function ShareScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: members = [], isLoading } = useShareMembers(selectedPetId ?? 0);
  const { mutate: invite, isPending: inviting } = useInvite(selectedPetId ?? 0);
  const { mutate: remove } = useRemoveMember(selectedPetId ?? 0);

  const isFree = user?.subscriptionType === 'FREE';

  const handleInvite = () => {
    if (!selectedPetId) return;
    if (isFree && members.length >= Config.freeMaxShareMembers) {
      showPremiumModal(`무료 플랜은 케어 공유를 ${Config.freeMaxShareMembers}명까지만 할 수 있어요.`);
      return;
    }
    invite(undefined, {
      onSuccess: (res) => {
        Share.share({
          message: `발자국 앱에서 반려동물 케어를 함께 해요! 초대 링크: ${res.inviteLink}`,
          title: '케어 공유 초대',
        });
      },
      onError: () => Alert.alert('오류', '초대 링크 생성에 실패했어요.'),
    });
  };

  const handleRemove = (member: ShareMember) => {
    Alert.alert('멤버 제거', `${member.memberName}님을 공유에서 제거하시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '제거', style: 'destructive', onPress: () => remove(member.memberId) },
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
          케어 공유 설정
        </Text>
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingVertical: Spacing.sm }}>
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
          data={members}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={{ backgroundColor: Colors.primaryLight, borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.lg, marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
                color: Colors.text.primary, marginBottom: Spacing.xs }}>
                가족·친구와 함께 돌보세요
              </Text>
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary,
                marginBottom: Spacing.lg }}>
                초대 링크를 공유하면 진료기록과 알림을 함께 볼 수 있어요.
                {isFree && ` (무료 플랜: ${Config.freeMaxShareMembers}명)`}
              </Text>
              <TouchableOpacity
                onPress={handleInvite}
                disabled={inviting}
                style={{ backgroundColor: Colors.primary, borderRadius: Spacing.borderRadius.md,
                  paddingVertical: Spacing.md, alignItems: 'center' }}>
                {inviting
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={{ color: Colors.white, fontWeight: Typography.weight.semibold,
                      fontSize: Typography.size.md }}>
                      초대 링크 생성
                    </Text>}
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
                공유 중인 멤버가 없어요
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center',
              backgroundColor: Colors.white, borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.md, marginBottom: Spacing.sm,
              borderWidth: 1, borderColor: Colors.border }}>
              {item.memberProfileImage ? (
                <Image source={{ uri: item.memberProfileImage }}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: Spacing.md }} />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 20, marginRight: Spacing.md,
                  backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: Typography.size.md, color: Colors.primary }}>
                    {item.memberName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={{ flex: 1, fontSize: Typography.size.md, color: Colors.text.primary }}>
                {item.memberName}
              </Text>
              <TouchableOpacity onPress={() => handleRemove(item)} hitSlop={8}>
                <Feather name="user-x" size={20} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
