import React from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { usePets } from '../../features/pet/hooks/usePets';
import { usePurchase, useRestorePurchase } from '../../features/subscription/hooks/useSubscription';
import { useUiStore } from '../../shared/store/uiStore';
import { Colors, Typography, Spacing, Config } from '../../constants';

const MENU_SECTIONS = [
  {
    title: '케어',
    items: [
      { key: 'share', icon: 'users', label: '케어 공유 설정', route: '/share' },
    ],
  },
  {
    title: '설정',
    items: [
      { key: 'notifications', icon: 'bell', label: '알림 설정', route: '/notifications' },
    ],
  },
  {
    title: '고객지원',
    items: [
      { key: 'notice', icon: 'info', label: '공지사항', route: '/notices' },
      { key: 'inquiry', icon: 'message-circle', label: '문의하기', route: '/inquiry' },
    ],
  },
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
        color: isPremium ? Colors.premiumText : Colors.text.secondary,
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
    router.push('/pets/new');
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

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
                  <TouchableOpacity
                    key={pet.id}
                    className="items-center"
                    style={{ width: 72 }}
                    onPress={() => router.push({ pathname: '/pets/new', params: { petId: pet.id } })}>

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
                  </TouchableOpacity>
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
                paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm }}>
              {purchasing
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={{ color: Colors.white, fontWeight: Typography.weight.semibold,
                    fontSize: Typography.size.md }}>
                    지금 시작하기
                  </Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={restore} disabled={restoring} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary }}>
                {restoring ? '복원 중...' : '구매 복원'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 메뉴 섹션 */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={{ marginTop: Spacing.xl }}>
            <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
              color: Colors.text.tertiary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
              {section.title}
            </Text>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => router.push(item.route as any)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
                  borderTopWidth: idx === 0 ? 1 : 0, borderBottomWidth: 1, borderColor: Colors.border,
                  backgroundColor: Colors.white,
                }}>
                <Feather name={item.icon as any} size={20} color={Colors.text.secondary} />
                <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.md,
                  color: Colors.text.primary }}>
                  {item.label}
                </Text>
                <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* 법적 고지 */}
        <View style={{ marginTop: Spacing.xl }}>
          {[
            { label: '서비스 이용약관', url: 'https://arrivallab.com/terms' },
            { label: '개인정보 처리방침', url: 'https://arrivallab.com/privacy' },
            { label: '오픈소스 라이선스', url: 'https://arrivallab.com/oss' },
          ].map((item, idx, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => Linking.openURL(item.url)}
              style={{ flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                borderTopWidth: idx === 0 ? 1 : 0, borderBottomWidth: 1, borderColor: Colors.border }}>
              <Text style={{ flex: 1, fontSize: Typography.size.sm, color: Colors.text.secondary }}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
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

          <Text style={{ fontSize: Typography.size.xs, color: Colors.text.disabled,
            textAlign: 'center' }}>
            버전 {appVersion}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
