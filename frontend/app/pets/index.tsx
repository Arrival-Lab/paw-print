import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Modal, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import i18n from '../../shared/i18n';
import { Spacing, Typography, getLimits, isUnlimited } from '../../constants';
import { useColors, useTheme } from '../../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../../shared/hooks/useBottomSheetSafePadding';
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

function ageFromBirthDate(birth: string | null): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years -= 1;
  if (years < 1) {
    const months = (now.getFullYear() - b.getFullYear()) * 12 + m;
    return i18n.t('home.age.months', { count: Math.max(months, 0) });
  }
  return i18n.t('home.age.years', { count: years });
}

export default function PetsListScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const { data, isLoading } = usePets();
  const pets = (data ?? []) as unknown as Pet[];
  const subscriptionType = useAuthStore((s) => s.user?.subscriptionType);
  const limits = getLimits(subscriptionType);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const { refreshing, onRefresh } = useRefresh([['pets']]);
  const atLimit = pets.length >= limits.maxPets;
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const openAddSheet = () => setShowAddSheet(true);

  // 직접 추가는 무료 한도(3마리) 초과 시 PremiumModal. 초대 코드는 서버가 한도 검증.
  const handleAddDirect = () => {
    setShowAddSheet(false);
    if (atLimit) {
      showPremiumModal(t('pet.petLimit', { max: limits.maxPets }));
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
      <ScreenHeader title={t('pet.manage')} back />
      {isLoading ? (
        <LoadingSpinner label={t('pet.loading')} />
      ) : pets.length === 0 ? (
        <EmptyState
          icon="heart"
          title={t('pet.emptyTitle')}
          description={t('pet.emptyDesc')}
          action={{ label: t('pet.add'), onPress: openAddSheet }}
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
              {t('pet.count', { n: isUnlimited(limits.maxPets) ? String(pets.length) : `${pets.length} / ${limits.maxPets}` })}
            </Text>
          </View>
          {pets.map((pet) => (
            <PetRow key={pet.id} pet={pet} />
          ))}
          <View style={{ marginTop: Spacing.md }}>
            <Button variant="primary" icon="plus" onPress={openAddSheet}>
              {t('pet.add')}
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
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const subscriptionType = useAuthStore((s) => s.user?.subscriptionType);
  const limits = getLimits(subscriptionType);
  const options: { icon: React.ComponentProps<typeof Feather>['name']; label: string; desc: string; onPress: () => void; disabled?: boolean }[] = [
    {
      icon: 'plus-circle',
      label: t('pet.addDirect'),
      desc: atLimit ? t('pet.addDirectLimitDesc', { max: limits.maxPets }) : t('pet.addDirectDesc'),
      onPress: onAddDirect,
    },
    {
      icon: 'user-plus',
      label: t('pet.addByCode'),
      desc: t('pet.addByCodeDesc'),
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
              paddingBottom: padBottom,
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
              {t('pet.add')}
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
  const { t } = useTranslation();
  const age = ageFromBirthDate(pet.birthDate);
  const meta = [age, t(`species.${pet.species}`)].filter(Boolean).join(' · ');
  const shareLabel = pet.isShared
    ? t('pet.sharedBy', { name: pet.ownerName ?? t('pet.owner') })
    : pet.sharedMemberCount && pet.sharedMemberCount > 0
      ? t('pet.sharingWith', { count: pet.sharedMemberCount })
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
