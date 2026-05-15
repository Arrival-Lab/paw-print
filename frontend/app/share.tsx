import React, { useState } from 'react';
import { View, Text, Alert, FlatList, Share, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { useShareMembers, useInvite, useRemoveMember } from '../features/share/hooks/useShare';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { Spacing, Typography, Config } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import type { ShareMember } from '../features/share/api/shareApi';

export default function ShareScreen() {
  const Colors = useColors();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="케어 공유 설정" back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: Spacing.lg, backgroundColor: Colors.primary }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Feather name="users" size={20} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.preset.title, color: Colors.white }}>
                    가족·친구와 함께 돌보세요
                  </Text>
                  <Text
                    style={{ ...Typography.preset.bodySmall, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}
                  >
                    {isFree
                      ? `무료 플랜: ${members.length}/${Config.freeMaxShareMembers}명`
                      : '프리미엄: 무제한 공유'}
                  </Text>
                </View>
              </View>
              <Button variant="secondary" fullWidth onPress={handleInvite} loading={inviting} icon="link">
                초대 링크 생성
              </Button>
            </Card>
          }
          ListEmptyComponent={
            <EmptyState
              icon="user-plus"
              title="공유 중인 멤버가 없어요"
              description="초대 링크를 만들어 가족·친구와 공유해보세요"
              tone="muted"
            />
          }
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.memberProfileImage ? (
                  <Image
                    source={{ uri: item.memberProfileImage }}
                    style={{ width: 44, height: 44, borderRadius: 22, marginRight: Spacing.md }}
                  />
                ) : (
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 22, marginRight: Spacing.md,
                      backgroundColor: Colors.primaryLight,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ ...Typography.preset.title, color: Colors.primary }}>
                      {item.memberName.charAt(0)}
                    </Text>
                  </View>
                )}
                <Text style={{ flex: 1, ...Typography.preset.bodyMedium, color: Colors.text.primary }}>
                  {item.memberName}
                </Text>
                <Pressable onPress={() => handleRemove(item)} hitSlop={Spacing.hitSlop}>
                  <Feather name="user-x" size={20} color={Colors.status.error} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
