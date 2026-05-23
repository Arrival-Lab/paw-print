import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Modal, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography, Config } from '../../constants';
import { useColors, useTheme } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import GlassOverlay from '../../shared/components/GlassOverlay';
import { useRefresh } from '../../shared/hooks/useRefresh';
import { usePets } from '../../features/pet/hooks/usePets';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUiStore } from '../../shared/store/uiStore';
import type { Pet } from '../../features/pet/api/petApi';
import InviteCodeDialog from '../../features/share/components/InviteCodeDialog';

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

function ageFromBirthDate(birth: string | null): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years -= 1;
  if (years < 1) {
    const months = (now.getFullYear() - b.getFullYear()) * 12 + m;
    return `${Math.max(months, 0)}개월`;
  }
  return `${years}살`;
}

export default function PetsListScreen() {
  const Colors = useColors();
  const { data, isLoading } = usePets();
  const pets = (data ?? []) as unknown as Pet[];
  const isFree = useAuthStore((s) => s.user?.subscriptionType === 'FREE');
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const { refreshing, onRefresh } = useRefresh([['pets']]);
  const atLimit = isFree && pets.length >= Config.freeMaxPets;
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const openAddSheet = () => setShowAddSheet(true);

  // 직접 추가는 무료 한도(3마리) 초과 시 PremiumModal. 초대 코드는 서버가 한도 검증.
  const handleAddDirect = () => {
    setShowAddSheet(false);
    if (atLimit) {
      showPremiumModal(`무료 플랜은 반려동물을 ${Config.freeMaxPets}마리까지 등록할 수 있어요.`);
      return;
    }
    router.push('/pets/new');
  };

  const handleAddByCode = () => {
    setShowAddSheet(false);
    setShowInviteCode(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="반려동물 관리" back />
      {isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : pets.length === 0 ? (
        <EmptyState
          icon="heart"
          title="등록된 반려동물이 없어요"
          description="직접 등록하거나 초대 코드로 받을 수 있어요"
          action={{ label: '반려동물 추가', onPress: openAddSheet }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: 120, gap: Spacing.sm }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
        >
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              {pets.length}{isFree ? ` / ${Config.freeMaxPets}` : ''}마리
            </Text>
          </View>
          {pets.map((pet) => (
            <PetRow key={pet.id} pet={pet} />
          ))}
          <View style={{ marginTop: Spacing.md }}>
            <Button variant="primary" icon="plus" onPress={openAddSheet}>
              반려동물 추가
            </Button>
          </View>
        </ScrollView>
      )}

      <AddPetSheet
        visible={showAddSheet}
        atLimit={atLimit}
        onClose={() => setShowAddSheet(false)}
        onAddDirect={handleAddDirect}
        onAddByCode={handleAddByCode}
      />
      <InviteCodeDialog visible={showInviteCode} onClose={() => setShowInviteCode(false)} />
    </SafeAreaView>
  );
}

interface AddPetSheetProps {
  visible: boolean;
  atLimit: boolean;
  onClose: () => void;
  onAddDirect: () => void;
  onAddByCode: () => void;
}

function AddPetSheet({ visible, atLimit, onClose, onAddDirect, onAddByCode }: AddPetSheetProps) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const options: { icon: React.ComponentProps<typeof Feather>['name']; label: string; desc: string; onPress: () => void; disabled?: boolean }[] = [
    {
      icon: 'plus-circle',
      label: '직접 추가',
      desc: atLimit ? `무료 ${Config.freeMaxPets}마리 한도 도달 — 프리미엄으로 무제한` : '내 반려동물을 새로 등록',
      onPress: onAddDirect,
    },
    {
      icon: 'user-plus',
      label: '초대 코드로 받기',
      desc: '가족·친구가 공유한 6자리 코드 입력',
      onPress: onAddByCode,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GlassOverlay onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: Colors.glass.border,
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              backgroundColor: Colors.glass.surfaceStrong,
              paddingHorizontal: Spacing.lg,
              paddingTop: Spacing.lg,
              paddingBottom: Spacing.xxxl,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.border,
                marginBottom: Spacing.lg,
              }}
            />
            <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.lg }}>
              반려동물 추가
            </Text>
            {options.map((o, idx) => (
              <TouchableOpacity
                key={o.label}
                onPress={o.onPress}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  paddingVertical: Spacing.md,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: Colors.border,
                }}
              >
                <Feather
                  name={o.icon}
                  size={20}
                  color={Colors.text.secondary}
                  style={{ width: 24, textAlign: 'center' }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...Typography.preset.body,
                      color: Colors.text.primary,
                      fontWeight: Typography.weight.semibold,
                    }}
                  >
                    {o.label}
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                    {o.desc}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}

function PetRow({ pet }: { pet: Pet }) {
  const Colors = useColors();
  const age = ageFromBirthDate(pet.birthDate);
  const meta = [age, SPECIES_LABEL[pet.species] ?? null].filter(Boolean).join(' · ');
  const shareLabel = pet.isShared
    ? `${pet.ownerName ?? '소유자'}님이 공유함`
    : pet.sharedMemberCount && pet.sharedMemberCount > 0
      ? `${pet.sharedMemberCount}명과 공유 중`
      : null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/pets/[id]', params: { id: pet.id } })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
      }}
    >
      {pet.profileImage ? (
        <Image
          source={{ uri: pet.profileImage }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
        />
      ) : (
        <View
          style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Image
            source={SPECIES_PAW[pet.species] ?? SPECIES_PAW.OTHER}
            style={{ width: 30, height: 30 }}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.body, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          {pet.name}
        </Text>
        {meta ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
        {shareLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Feather name="users" size={11} color={Colors.primaryDark} />
            <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
              {shareLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}
