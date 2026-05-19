import { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Spacing, Typography, Elevation } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Card from '../../../shared/components/Card';
import CircularProgress from '../../../shared/components/CircularProgress';
import { usePets } from '../../pet/hooks/usePets';
import type { Pet } from '../../pet/api/petApi';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';
import { useRecentWeights } from '../../metric/hooks/useRecentWeights';
import { useAllergies } from '../../food/hooks/useAllergies';
import Badge from '../../../shared/components/Badge';

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

const FILTER_AVATAR_SIZE = 55;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface CareInfo { completed: number; total: number }

/**
 * 홈 메인 카드 — 좌상단에 필터 아바타 overlay, 안에 펫 row 들 (전체 모드) 또는 선택된 펫 컨텐츠.
 * 펫 1마리 이하면 필터 의미 없으니 본인 아바타 숨김.
 */
export default function PetGroupCard({ careMap }: { careMap: Map<number, CareInfo> }) {
  const Colors = useColors();
  const { data } = usePets();
  const pets = (data ?? []) as unknown as Pet[];
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const [expanded, setExpanded] = useState(false);
  const filterAnchorRef = useRef<View>(null);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const showAvatar = pets.length >= 1;
  const canToggle = pets.length > 1;
  const petIds = pets.map((p) => p.id);
  const weightMap = useRecentWeights(petIds);
  const allergyMap = useAllergies(petIds);

  const selectedPet = selectedPetId ? pets.find((p) => p.id === selectedPetId) : null;
  const onlyPet = pets.length === 1 ? pets[0] : null;

  const toggle = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (filterAnchorRef.current) {
      filterAnchorRef.current.measureInWindow((x, y) => {
        setAnchorPos({ x, y });
        setExpanded(true);
      });
    } else {
      setExpanded(true);
    }
  };

  const choose = (petId: number | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPetId(petId);
    setExpanded(false);
  };

  return (
    <View
      style={{
        position: 'relative',
        marginTop: FILTER_AVATAR_SIZE * 0.4 + Spacing.xs,
        marginLeft: FILTER_AVATAR_SIZE * 0.4,
        marginRight: FILTER_AVATAR_SIZE * 0.4,
      }}
    >
      {/* 좌상단 필터 overlay (접힘 상태) — 펼침 상태는 Modal 로. */}
      {showAvatar ? (
        <View
          ref={filterAnchorRef}
          collapsable={false}
          style={{
            position: 'absolute',
            top: -FILTER_AVATAR_SIZE * 0.4,
            left: -FILTER_AVATAR_SIZE * 0.4,
            zIndex: 20,
          }}
        >
          {!expanded ? (
            <FilterAvatar
              uri={onlyPet ? onlyPet.profileImage : (selectedPet ? selectedPet.profileImage : null)}
              species={onlyPet?.species ?? selectedPet?.species}
              isUser={!onlyPet && !selectedPet}
              selected
              onPress={canToggle ? toggle : () => {}}
            />
          ) : (
            // 펼침 동안 모달 안 아바타들이 같은 위치에 떠 있어 anchor 만 비워둠 (size 유지).
            <View style={{ width: FILTER_AVATAR_SIZE, height: FILTER_AVATAR_SIZE }} />
          )}
        </View>
      ) : null}

      {/* 펼침 모달 — 화면 전체 BlurView backdrop + 아바타 stack */}
      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setExpanded(false)}
      >
        <Pressable onPress={() => setExpanded(false)} style={{ flex: 1 }}>
          <BlurView intensity={40} tint="default" style={StyleSheet.absoluteFillObject} />
          <View
            style={{
              position: 'absolute',
              top: anchorPos.y,
              left: anchorPos.x,
              gap: Spacing.md,
            }}
          >
            {(() => {
              // 선택된 펫이 있으면 맨 위 — anchor 자리에 그대로 유지되어 시각 연속성.
              const ordered: Array<{ kind: 'all' } | { kind: 'pet'; pet: Pet }> = selectedPet
                ? [
                    { kind: 'pet', pet: selectedPet },
                    { kind: 'all' },
                    ...pets
                      .filter((p) => p.id !== selectedPetId)
                      .map((p) => ({ kind: 'pet' as const, pet: p })),
                  ]
                : [{ kind: 'all' }, ...pets.map((p) => ({ kind: 'pet' as const, pet: p }))];

              return ordered.map((item, idx) => (
                <Animated.View
                  key={item.kind === 'all' ? 'all' : item.pet.id}
                  entering={FadeInDown.duration(220).delay(idx * 50)}
                  exiting={FadeOutUp.duration(180)}
                >
                  {item.kind === 'all' ? (
                    <FilterRow
                      avatar={
                        <FilterAvatar
                          uri={null}
                          isUser
                          selected={!selectedPet}
                          onPress={() => (selectedPet ? choose(null) : setExpanded(false))}
                        />
                      }
                      label="전체"
                      onPress={() => (selectedPet ? choose(null) : setExpanded(false))}
                    />
                  ) : (
                    <FilterRow
                      avatar={
                        <FilterAvatar
                          uri={item.pet.profileImage}
                          species={item.pet.species}
                          selected={selectedPetId === item.pet.id}
                          onPress={() =>
                            selectedPetId === item.pet.id ? setExpanded(false) : choose(item.pet.id)
                          }
                        />
                      }
                      label={item.pet.name}
                      onPress={() =>
                        selectedPetId === item.pet.id ? setExpanded(false) : choose(item.pet.id)
                      }
                    />
                  )}
                </Animated.View>
              ));
            })()}
          </View>
        </Pressable>
      </Modal>

      <Card variant="elevated" padding="lg">
        <View
          style={{
            paddingHorizontal: showAvatar ? FILTER_AVATAR_SIZE * 0.6 - Spacing.lg : 0,
          }}
        >
          {selectedPet ? (
            <PetRow
              pet={selectedPet}
              care={careMap.get(selectedPet.id) ?? { completed: 0, total: 0 }}
              weight={weightMap.get(selectedPet.id) ?? null}
              allergies={allergyMap.get(selectedPet.id) ?? []}
              showAvatar={false}
            />
          ) : pets.length === 0 ? (
            <Text
              style={{
                ...Typography.preset.body,
                color: Colors.text.tertiary,
                textAlign: 'center',
                paddingVertical: Spacing.md,
              }}
            >
              펫 정보 없음
            </Text>
          ) : (
            <View style={{ gap: Spacing.lg }}>
              {pets.map((p) => (
                <PetRow
                  key={p.id}
                  pet={p}
                  care={careMap.get(p.id) ?? { completed: 0, total: 0 }}
                  weight={weightMap.get(p.id) ?? null}
                  allergies={allergyMap.get(p.id) ?? []}
                  showAvatar={!selectedPet}
                />
              ))}
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const SMALL_AVATAR_SIZE = 32;

function PetRow({
  pet, care, weight, allergies, showAvatar = false,
}: {
  pet: Pet;
  care: CareInfo;
  weight: number | null;
  allergies: string[];
  showAvatar?: boolean;
}) {
  const Colors = useColors();
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const age = ageFromBirthDate(pet.birthDate);

  const goToPetDetail = () => {
    router.push({ pathname: '/pets/[id]', params: { id: pet.id } });
  };

  const goToCare = () => {
    setSelectedPetId(pet.id);
    router.push({ pathname: '/(tabs)/records', params: { tab: 'daily' } });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={goToPetDetail}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
      >
        {showAvatar ? (
          pet.profileImage ? (
            <Image
              source={{ uri: pet.profileImage }}
              style={{
                width: SMALL_AVATAR_SIZE,
                height: SMALL_AVATAR_SIZE,
                borderRadius: SMALL_AVATAR_SIZE / 2,
              }}
            />
          ) : (
            <View
              style={{
                width: SMALL_AVATAR_SIZE,
                height: SMALL_AVATAR_SIZE,
                borderRadius: SMALL_AVATAR_SIZE / 2,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={SPECIES_PAW[pet.species] ?? SPECIES_PAW.OTHER}
                style={{ width: SMALL_AVATAR_SIZE * 0.65, height: SMALL_AVATAR_SIZE * 0.65 }}
              />
            </View>
          )
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...Typography.preset.title,
              fontWeight: Typography.weight.bold,
              color: Colors.text.primary,
            }}
          >
            {pet.name}
            {age ? (
              <Text
                style={{
                  ...Typography.preset.body,
                  fontWeight: Typography.weight.regular,
                  color: Colors.text.secondary,
                }}
              >
                {'  '}
                {age}
              </Text>
            ) : null}
          </Text>
          {weight != null ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.secondary,
                marginTop: 2,
              }}
            >
              {weight}kg
            </Text>
          ) : null}
          {allergies.length > 0 ? (
            <View style={{ flexDirection: 'row', marginTop: Spacing.xs }}>
              <Badge tone="warning">⚠ 알러지 {allergies.length}</Badge>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} onPress={goToCare}>
        <CircularProgress completed={care.completed} total={care.total} />
      </TouchableOpacity>
    </View>
  );
}

function FilterRow({
  avatar, label, onPress,
}: {
  avatar: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
    >
      {avatar}
      <Text
        style={{
          ...Typography.preset.title,
          fontWeight: Typography.weight.bold,
          color: Colors.text.primary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterAvatar({
  uri, species, isUser, selected, onPress,
}: {
  uri: string | null;
  species?: string;
  isUser?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: FILTER_AVATAR_SIZE,
        height: FILTER_AVATAR_SIZE,
        borderRadius: FILTER_AVATAR_SIZE / 2,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isUser ? 0 : selected ? 2 : 1,
        borderColor: selected ? Colors.primary : Colors.border,
        overflow: 'hidden',
        ...Elevation.floating,
      }}
    >
      {isUser ? (
        <Image
          source={require('../../../assets/reversal-icon.png')}
          style={{ width: FILTER_AVATAR_SIZE, height: FILTER_AVATAR_SIZE }}
          resizeMode="contain"
        />
      ) : uri ? (
        <Image
          source={{ uri }}
          style={{ width: FILTER_AVATAR_SIZE, height: FILTER_AVATAR_SIZE, borderRadius: FILTER_AVATAR_SIZE / 2 }}
        />
      ) : (
        <Image
          source={SPECIES_PAW[species ?? 'OTHER'] ?? SPECIES_PAW.OTHER}
          style={{ width: FILTER_AVATAR_SIZE * 0.6, height: FILTER_AVATAR_SIZE * 0.6 }}
        />
      )}
    </TouchableOpacity>
  );
}
