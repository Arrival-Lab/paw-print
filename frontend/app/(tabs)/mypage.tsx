import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Alert, Linking, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useColors } from '../../shared/hooks/useTheme';
import { Typography, Spacing } from '../../constants';
import GlassHeader from '../../shared/components/GlassHeader';
import Badge from '../../shared/components/Badge';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useRefresh } from '../../shared/hooks/useRefresh';
import NicknameEditModal from '../../features/auth/components/NicknameEditModal';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';

const MENU_SECTIONS: {
  title: string;
  items: {
    key: string;
    label: string;
    route: string;
    /** 외부 URL 로 열어야 하는 항목 — in-app browser. route 보다 우선. */
    url?: string;
    icon?: React.ComponentProps<typeof Feather>['name'];
    accent?: 'error' | 'premium';
  }[];
}[] = [
  {
    title: '빠른 진입',
    items: [
      { key: 'pets', label: '반려동물 관리', route: '/pets', icon: 'heart' },
      { key: 'hospital-nearby', label: '동물병원 찾기', route: '/hospital?mode=nearby', icon: 'map-pin' },
    ],
  },
  {
    title: '커뮤니티',
    items: [
      { key: 'community', label: '보호자 커뮤니티', route: '/community', icon: 'message-circle' },
    ],
  },
  {
    // 설정·도움말 합쳐서 한 섹션 — 단일 항목 섹션이 줄줄이 늘어나지 않게.
    title: '일반',
    items: [
      { key: 'settings', label: '설정', route: '/settings', icon: 'settings' },
      { key: 'help', label: '도움말', route: '/help', icon: 'help-circle' },
    ],
  },
];

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../assets/paws/dog.png'),
  CAT: require('../../assets/paws/cat.png'),
  BIRD: require('../../assets/paws/bird.png'),
  REPTILE: require('../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../assets/paws/small.png'),
  OTHER: require('../../assets/paws/other.png'),
};

function InitialAvatar({ name, size = 80, species }: { name: string; size?: number; species?: string }) {
  const Colors = useColors();
  const paw = species ? SPECIES_PAW[species] ?? SPECIES_PAW.OTHER : undefined;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {paw ? (
        <Image source={paw} style={{ width: size * 0.62, height: size * 0.62 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: size / 2.2, fontWeight: Typography.weight.bold, color: Colors.primary }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export default function MyPageScreen() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const isFree = user?.subscriptionType === 'FREE';
  const appVersion = Constants.expoConfig?.version ?? '—';
  const { refreshing, onRefresh } = useRefresh([['pets']]);
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: tabBarHeight + Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressViewOffset={headerHeight} />
        }
      >
        {/* 프로필 카드 — 가로 컴팩트: [사진] [닉네임/계정] [구독 뱃지 → 탭하면 /subscription] */}
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm }}>
          <Card variant="elevated" padding="md">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <InitialAvatar name={user.name} size={48} />
              )}
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => setShowNicknameEdit(true)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
                >
                  <Text
                    style={{
                      ...Typography.preset.bodyMedium,
                      fontWeight: Typography.weight.semibold,
                      color: user.nickname ? Colors.text.primary : Colors.text.tertiary,
                    }}
                    numberOfLines={1}
                  >
                    {user.nickname ?? '닉네임을 설정해주세요'}
                  </Text>
                  <Feather name="edit-2" size={12} color={Colors.text.tertiary} />
                </TouchableOpacity>
                <Text
                  style={{ marginTop: 2, ...Typography.preset.caption, color: Colors.text.tertiary }}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/subscription')}
                activeOpacity={0.7}
                accessibilityLabel="구독 관리"
                hitSlop={Spacing.hitSlop}
                style={{ alignSelf: 'center' }}
              >
                <Badge tone={isFree ? 'neutral' : 'premium'}>
                  {user.subscriptionType === 'FREE' ? 'FREE'
                    : user.subscriptionType === 'FRIEND' ? 'FRIEND ✦'
                    : user.subscriptionType === 'FAMILY' ? 'FAMILY ✦'
                    : 'PREMIUM ✦'}
                </Badge>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* 메뉴 섹션 */}
        <TourTarget tourId={TOUR_TARGETS.TAB_MYPAGE} wrap>
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={{ marginTop: Spacing.xl }}>
            <Text
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.secondary,
                fontWeight: Typography.weight.bold,
                paddingHorizontal: Spacing.xl,
                marginBottom: Spacing.sm,
              }}
            >
              {section.title}
            </Text>
            <View style={{ marginHorizontal: Spacing.lg }}>
              <Card variant="elevated" padding="none">
                {section.items.map((item, idx) => {
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => {
                        if (item.url) {
                          Linking.openURL(item.url);
                        } else {
                          router.push(item.route as any);
                        }
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.md,
                        paddingHorizontal: Spacing.xl,
                        paddingVertical: Spacing.lg,
                        backgroundColor: Colors.surfaceElevated,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: Colors.border,
                        borderTopLeftRadius: idx === 0 ? Spacing.borderRadius.lg : 0,
                        borderTopRightRadius: idx === 0 ? Spacing.borderRadius.lg : 0,
                        borderBottomLeftRadius: idx === section.items.length - 1 ? Spacing.borderRadius.lg : 0,
                        borderBottomRightRadius: idx === section.items.length - 1 ? Spacing.borderRadius.lg : 0,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          ...Typography.preset.body,
                          color: Colors.text.primary,
                        }}
                      >
                        {item.label}
                      </Text>
                      <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          </View>
        ))}
        </TourTarget>

        {/* 하단 */}
        <View style={{ marginTop: Spacing.xxl, paddingHorizontal: Spacing.xl, gap: Spacing.lg, alignItems: 'center' }}>
          <Pressable onPress={handleLogout} hitSlop={Spacing.hitSlop}>
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.status.error }}>로그아웃</Text>
          </Pressable>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>버전 {appVersion}</Text>
        </View>
      </ScrollView>

      <NicknameEditModal visible={showNicknameEdit} onClose={() => setShowNicknameEdit(false)} />

      <GlassHeader title="더보기" onHeightChange={setHeaderHeight} />
    </View>
  );
}
