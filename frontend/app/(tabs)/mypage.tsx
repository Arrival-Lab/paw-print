import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Alert, Linking, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { usePets } from '../../features/pet/hooks/usePets';
import { useUiStore } from '../../shared/store/uiStore';
import { useTheme, useColors } from '../../shared/hooks/useTheme';
import type { ThemeMode } from '../../shared/store/themeStore';
import { Typography, Spacing, Config, Elevation } from '../../constants';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Badge from '../../shared/components/Badge';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useRefresh } from '../../shared/hooks/useRefresh';
import PetCard, { AddPetTile } from '../../features/pet/components/PetCard';
import MonthlyCareGuideModal from '../../features/care/components/MonthlyCareGuideModal';

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
      { key: 'hospital-nearby', label: '동물병원 찾기', route: '/hospital?mode=nearby', icon: 'map-pin' },
      { key: 'care-guide', label: '이달의 케어 안내', route: '', icon: 'book-open' },
      { key: 'share', label: '케어 공유 설정', route: '/share', icon: 'users' },
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
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { data: pets, isLoading: petsLoading } = usePets();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const isFree = user?.subscriptionType === 'FREE';
  const appVersion = Constants.expoConfig?.version ?? '—';
  const { refreshing, onRefresh } = useRefresh([['pets']]);
  const [showCareGuide, setShowCareGuide] = useState(false);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="더보기" hideMypage />

      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
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
                <Text style={{ ...Typography.preset.h3, color: Colors.text.primary }}>{user.name}</Text>
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

        {/* 내 반려동물 */}
        <View style={{ paddingTop: Spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: Spacing.lg,
              marginBottom: Spacing.md,
            }}
          >
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>내 반려동물</Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              {pets?.length ?? 0}{isFree ? ` / ${Config.freeMaxPets}` : ''}
            </Text>
          </View>
          {petsLoading ? (
            <LoadingSpinner inline label="불러오는 중" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
            >
              {(pets ?? []).map((pet: any) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onPress={() => router.push({ pathname: '/pets/[id]', params: { id: pet.id } })}
                />
              ))}
              <AddPetTile
                onPress={handleAddPet}
                locked={isFree && (pets?.length ?? 0) >= Config.freeMaxPets}
              />
            </ScrollView>
          )}
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
                      {item.icon ? (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: accentBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Feather name={item.icon} size={16} color={accentFg} />
                        </View>
                      ) : null}
                      <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary }}>{item.label}</Text>
                      <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          </View>
        ))}

        {/* 법적 고지 */}
        <View style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.lg }}>
          <Card variant="outlined" padding="none">
            {[
              { label: '서비스 이용약관', url: 'https://arrivallab.com/terms' },
              { label: '개인정보 처리방침', url: 'https://arrivallab.com/privacy' },
              { label: '오픈소스 라이선스', url: 'https://arrivallab.com/oss' },
            ].map((item, idx, arr) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => Linking.openURL(item.url)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: Colors.border,
                }}
              >
                <Text style={{ flex: 1, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{item.label}</Text>
                <Feather name="external-link" size={14} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </Card>
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
    </SafeAreaView>
  );
}
