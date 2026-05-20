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
import { useTheme, useColors } from '../../shared/hooks/useTheme';
import type { ThemeMode } from '../../shared/store/themeStore';
import { Typography, Spacing, Elevation } from '../../constants';
import GlassHeader from '../../shared/components/GlassHeader';
import Badge from '../../shared/components/Badge';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useRefresh } from '../../shared/hooks/useRefresh';
import MonthlyCareGuideModal from '../../features/care/components/MonthlyCareGuideModal';
import InviteCodeDialog from '../../features/share/components/InviteCodeDialog';
import NicknameEditModal from '../../features/auth/components/NicknameEditModal';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'system', label: '시스템', icon: 'smartphone' },
  { value: 'light', label: '라이트', icon: 'sun' },
  { value: 'dark', label: '다크', icon: 'moon' },
];

function ThemeSelector() {
  const { mode, setMode } = useTheme();
  const Colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: Spacing.borderRadius.md,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 4,
      }}
    >
      {THEME_OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setMode(opt.value)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.xs,
              paddingVertical: Spacing.sm + 2,
              paddingHorizontal: Spacing.sm,
              backgroundColor: active ? Colors.white : 'transparent',
              borderRadius: Spacing.borderRadius.sm,
              ...(active ? Elevation.card : {}),
            }}
          >
            <Feather name={opt.icon} size={15} color={active ? Colors.primary : Colors.text.secondary} />
            <Text
              style={{
                ...Typography.preset.label,
                color: active ? Colors.primary : Colors.text.secondary,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MENU_SECTIONS: {
  title: string;
  items: {
    key: string;
    label: string;
    route: string;
    icon?: React.ComponentProps<typeof Feather>['name'];
    accent?: 'error' | 'premium';
  }[];
}[] = [
  {
    title: '빠른 진입',
    items: [
      { key: 'pets', label: '반려동물 관리', route: '/pets', icon: 'heart' },
      { key: 'hospital-nearby', label: '동물병원 찾기', route: '/hospital?mode=nearby', icon: 'map-pin' },
      { key: 'care-guide', label: '이달의 케어 안내', route: '', icon: 'book-open' },
      { key: 'invite-code', label: '초대 코드로 공유 수락', route: '', icon: 'key' },
    ],
  },
  {
    title: '멤버십',
    items: [{ key: 'subscription', label: '프리미엄 멤버십', route: '/subscription', icon: 'star', accent: 'premium' }],
  },
  { title: '설정', items: [{ key: 'notifications', label: '알림 설정', route: '/notifications', icon: 'bell' }] },
  {
    title: '고객지원',
    items: [
      { key: 'notice', label: '공지사항', route: '/notices', icon: 'volume-2' },
      { key: 'inquiry', label: '문의하기', route: '/inquiry', icon: 'message-square' },
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

const SPECIES_LABEL: Record<string, string> = {
  DOG: '강아지',
  CAT: '고양이',
  BIRD: '새',
  REPTILE: '파충류',
  SMALL_ANIMAL: '소동물',
  OTHER: '기타',
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
  const [showCareGuide, setShowCareGuide] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
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
        {/* 프로필 카드 */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
          <Card variant="elevated" padding="lg">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={{ width: 64, height: 64, borderRadius: 32 }} />
              ) : (
                <InitialAvatar name={user.name} size={64} />
              )}
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => setShowNicknameEdit(true)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
                >
                  <Text style={{ ...Typography.preset.h3, color: user.nickname ? Colors.text.primary : Colors.text.tertiary }}>
                    {user.nickname ?? '닉네임을 설정해주세요'}
                  </Text>
                  <Feather name="edit-2" size={14} color={Colors.text.tertiary} />
                </TouchableOpacity>
                <Text style={{ marginTop: 2, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
                  {user.email}
                </Text>
                <View style={{ marginTop: Spacing.sm }}>
                  <Badge tone={isFree ? 'neutral' : 'premium'}>
                    {isFree ? 'FREE' : 'PREMIUM ✦'}
                  </Badge>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* 화면 테마 */}
        <View style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.lg }}>
          <Text
            style={{
              ...Typography.preset.label,
              color: Colors.text.tertiary,
              marginBottom: Spacing.sm,
              textTransform: 'uppercase',
            }}
          >
            화면
          </Text>
          <Card variant="elevated" padding="md">
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>테마</Text>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                시스템 설정을 따르거나 직접 선택
              </Text>
            </View>
            <ThemeSelector />
          </Card>
        </View>

        {/* 메뉴 섹션 */}
        <TourTarget tourId={TOUR_TARGETS.TAB_MYPAGE} wrap>
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={{ marginTop: Spacing.xl }}>
            <Text
              style={{
                ...Typography.preset.label,
                color: Colors.text.tertiary,
                paddingHorizontal: Spacing.lg,
                marginBottom: Spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </Text>
            <View style={{ marginHorizontal: Spacing.lg }}>
              <Card variant="elevated" padding="none">
                {section.items.map((item, idx) => {
                  const accentBg = item.accent === 'error'
                    ? Colors.status.errorBg
                    : item.accent === 'premium'
                      ? Colors.premiumBg
                      : Colors.primaryLight;
                  const accentFg = item.accent === 'error'
                    ? Colors.status.error
                    : item.accent === 'premium'
                      ? Colors.premiumText
                      : Colors.primary;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => {
                        if (item.key === 'care-guide') {
                          setShowCareGuide(true);
                        } else if (item.key === 'invite-code') {
                          setShowInviteCode(true);
                        } else {
                          router.push(item.route as any);
                        }
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.md,
                        paddingHorizontal: Spacing.lg,
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
                      <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary }}>{item.label}</Text>
                      <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          </View>
        ))}
        </TourTarget>

        {/* 법적 고지 — 카드 없는 평탄 리스트 */}
        <View style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.lg, gap: Spacing.md }}>
          {[
            { label: '서비스 이용약관', url: 'https://arrivallab.com/terms' },
            { label: '개인정보 처리방침', url: 'https://arrivallab.com/privacy' },
            { label: '오픈소스 라이선스', url: 'https://arrivallab.com/oss' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => Linking.openURL(item.url)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ flex: 1, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{item.label}</Text>
              <Feather name="chevron-right" size={14} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 하단 */}
        <View style={{ marginTop: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.lg, alignItems: 'center' }}>
          <Pressable onPress={handleLogout} hitSlop={Spacing.hitSlop}>
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.status.error }}>로그아웃</Text>
          </Pressable>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>버전 {appVersion}</Text>
        </View>
      </ScrollView>

      <MonthlyCareGuideModal visible={showCareGuide} onClose={() => setShowCareGuide(false)} />
      <InviteCodeDialog visible={showInviteCode} onClose={() => setShowInviteCode(false)} />
      <NicknameEditModal visible={showNicknameEdit} onClose={() => setShowNicknameEdit(false)} />

      <GlassHeader title="더보기" hideMypage onHeightChange={setHeaderHeight} />
    </View>
  );
}
