import React from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { usePets } from '../../features/pet/hooks/usePets';
import { usePurchase, useRestorePurchase } from '../../features/subscription/hooks/useSubscription';
import { useUiStore } from '../../shared/store/uiStore';
import { Colors, Typography, Spacing, Config } from '../../constants';

const MENU_ITEMS = [
  { key: 'vaccine', icon: 'shield', label: '예방접종 관리' },
  { key: 'food', icon: 'coffee', label: '먹이·알러지 정보' },
  { key: 'share', icon: 'users', label: '케어 공유 설정' },
  { key: 'notifications', icon: 'bell', label: '알림 설정' },
  { key: 'notice', icon: 'info', label: '공지사항' },
  { key: 'inquiry', icon: 'message-circle', label: '문의하기' },
] as const;

function InitialAvatar({ name }: { name: string }) {
  return (
    <View
      className="w-20 h-20 rounded-full items-center justify-center"
      style={{ backgroundColor: Colors.primaryLight }}>
      <Text style={{ fontSize: Typography.size.xxl, fontWeight: Typography.weight.bold, color: Colors.primary }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function SubscriptionBadge({ type }: { type: 'FREE' | 'PREMIUM' }) {
  const isPremium = type === 'PREMIUM';
  return (
    <View
      className="px-3 py-1 rounded-full mt-2"
      style={{ backgroundColor: isPremium ? Colors.premium : Colors.surface }}>
      <Text style={{
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.semibold,
        color: isPremium ? '#7A5C00' : Colors.text.secondary,
      }}>
        {isPremium ? 'PREMIUM ✦' : 'FREE'}
      </Text>
    </View>
  );
}

export default function MyPageScreen() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { data: pets, isLoading: petsLoading } = usePets();
  const { purchase, loading: purchasing } = usePurchase();
  const { restore, loading: restoring } = useRestorePurchase();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const isFree = user?.subscriptionType === 'FREE';
  const appVersion = Constants.expoConfig?.version ?? '—';

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  const handleAddPet = () => {
    if (isFree && (pets?.length ?? 0) >= Config.freeMaxPets) {
      showPremiumModal(`무료 플랜은 반려동물을 최대 ${Config.freeMaxPets}마리까지 등록할 수 있어요.`);
      return;
    }
    // TODO: 반려동물 추가 화면으로 이동
  };

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxxl }}>

        {/* 프로필 */}
        <View className="items-center pt-8 pb-6 border-b border-border">
          {user.profileImage
            ? <Image source={{ uri: user.profileImage }} className="w-20 h-20 rounded-full" />
            : <InitialAvatar name={user.name} />}
          <Text style={{ fontSize: Typography.size.lg, fontWeight: Typography.weight.bold,
            color: Colors.text.primary, marginTop: Spacing.md }}>
            {user.name}
          </Text>
          <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary, marginTop: Spacing.xs }}>
            {user.email}
          </Text>
          <SubscriptionBadge type={user.subscriptionType} />
        </View>

        {/* 내 반려동물 */}
        <View style={{ paddingTop: Spacing.xl }}>
          <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
            color: Colors.text.primary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
            내 반려동물
          </Text>
          {petsLoading
            ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
            : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}>
                {(pets ?? []).map((pet) => (
                  <View key={pet.id} className="items-center" style={{ width: 72 }}>
                    {pet.profileImage
                      ? <Image source={{ uri: pet.profileImage }}
                          style={{ width: 56, height: 56, borderRadius: 28 }} />
                      : (
                        <View style={{ width: 56, height: 56, borderRadius: 28,
                          backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: Typography.size.xl, color: Colors.primary }}>
                            {pet.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                    <Text numberOfLines={1} style={{ fontSize: Typography.size.xs,
                      color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' }}>
                      {pet.name}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: Typography.size.xs,
                      color: Colors.text.tertiary, textAlign: 'center' }}>
                      {pet.species}
                    </Text>
                  </View>
                ))}
                {/* 추가 카드 */}
                <TouchableOpacity onPress={handleAddPet} className="items-center" style={{ width: 72 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1.5,
                    borderColor: Colors.border, borderStyle: 'dashed',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="plus" size={22} color={Colors.text.tertiary} />
                  </View>
                  <Text style={{ fontSize: Typography.size.xs, color: Colors.text.tertiary,
                    marginTop: Spacing.xs }}>
                    추가
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
        </View>

        {/* 프리미엄 배너 (FREE만) */}
        {isFree && (
          <View style={{ margin: Spacing.lg, borderRadius: Spacing.borderRadius.lg,
            backgroundColor: Colors.primaryLight, padding: Spacing.lg }}>
            <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
              color: Colors.text.primary, marginBottom: Spacing.xs }}>
              발자국 프리미엄으로 모든 기능을 🐾
            </Text>
            <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary,
              marginBottom: Spacing.lg }}>
              월 {Config.premiumPriceMonthly.toLocaleString()}원
            </Text>
            <TouchableOpacity
              onPress={purchase}
              disabled={purchasing}
              style={{ backgroundColor: Colors.primary, borderRadius: Spacing.borderRadius.md,
                paddingVertical: Spacing.md, alignItems: 'center' }}>
              {purchasing
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={{ color: Colors.white, fontWeight: Typography.weight.semibold,
                    fontSize: Typography.size.md }}>
                    지금 시작하기
                  </Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* 메뉴 */}
        <View style={{ marginTop: Spacing.sm }}>
          {MENU_ITEMS.map((item, idx) => (
            <Pressable
              key={item.key}
              android_ripple={{ color: Colors.surface }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
                borderTopWidth: idx === 0 ? 1 : 0, borderBottomWidth: 1, borderColor: Colors.border,
                backgroundColor: pressed ? Colors.surface : Colors.white,
              })}>
              <Feather name={item.icon as any} size={20} color={Colors.text.secondary} />
              <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.md,
                color: Colors.text.primary }}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </Pressable>
          ))}
        </View>

        {/* 하단 버튼들 */}
        <View style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.lg, gap: Spacing.lg }}>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ fontSize: Typography.size.md, color: Colors.status.error,
              textAlign: 'center' }}>
              로그아웃
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={restore} disabled={restoring}>
            <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary,
              textAlign: 'center' }}>
              {restoring ? '복원 중...' : '구매 복원'}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: Typography.size.xs, color: Colors.text.disabled,
            textAlign: 'center' }}>
            버전 {appVersion}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
