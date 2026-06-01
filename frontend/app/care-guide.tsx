import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import { DEFAULT_FORBIDDEN_FOODS } from '../features/food/constants/defaultForbiddenFoods';
import type { Pet } from '../features/pet/api/petApi';

type Species = Pet['species'];

const SPECIES_OPTIONS: { value: Species; label: string; paw: any }[] = [
  { value: 'CAT', label: '고양이', paw: require('../assets/paws/cat.png') },
  { value: 'DOG', label: '강아지', paw: require('../assets/paws/dog.png') },
  { value: 'BIRD', label: '새', paw: require('../assets/paws/bird.png') },
  { value: 'REPTILE', label: '파충류', paw: require('../assets/paws/reptile.png') },
  { value: 'SMALL_ANIMAL', label: '소동물', paw: require('../assets/paws/small.png') },
];

export default function CareGuideScreen() {
  const Colors = useColors();
  const [species, setSpecies] = useState<Species>('CAT');

  const forbiddenFoods = useMemo(() => DEFAULT_FORBIDDEN_FOODS[species] ?? [], [species]);
  const speciesLabel = SPECIES_OPTIONS.find((o) => o.value === species)?.label ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="초보 집사 가이드" back hideEmergency />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.xxxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 종 선택 칩 */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.text.secondary,
              fontWeight: Typography.weight.semibold,
              marginBottom: Spacing.sm,
            }}
          >
            반려동물 종류
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.xs, paddingRight: Spacing.lg }}
          >
            {SPECIES_OPTIONS.map((opt) => {
              const selected = species === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSpecies(opt.value)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: Spacing.borderRadius.full,
                    backgroundColor: selected ? Colors.primaryDark : Colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: selected ? Colors.primaryDark : Colors.border,
                  }}
                >
                  <Image source={opt.paw} style={{ width: 16, height: 16 }} resizeMode="contain" />
                  <Text
                    style={{
                      ...Typography.preset.caption,
                      color: selected ? Colors.white : Colors.text.primary,
                      fontWeight: Typography.weight.semibold,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 위험 음식 카드 */}
        <Card variant="elevated" padding="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: Colors.status.warningBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="alert-triangle" size={14} color={Colors.status.warning} />
            </View>
            <Text
              style={{
                ...Typography.preset.bodyMedium,
                color: Colors.text.primary,
                fontWeight: Typography.weight.bold,
              }}
            >
              {speciesLabel}에게 위험한 음식
            </Text>
          </View>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginBottom: Spacing.md }}>
            아래 음식은 {speciesLabel}에게 위험해요. 먹으면 중독·소화기 장애 등 건강 문제가 생길 수 있고,
            증상이 의심되면 즉시 동물병원에 연락하세요.
          </Text>

          {forbiddenFoods.length === 0 ? (
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              해당 종에 대한 정보가 아직 준비 중이에요.
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {forbiddenFoods.map((food) => (
                <View
                  key={food}
                  style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 5,
                    borderRadius: Spacing.borderRadius.full,
                    backgroundColor: Colors.status.warningBg,
                  }}
                >
                  <Text
                    style={{
                      ...Typography.preset.caption,
                      color: Colors.text.primary,
                    }}
                  >
                    {food}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* 출처/면책 */}
        <Text
          style={{
            ...Typography.preset.caption,
            color: Colors.text.tertiary,
            marginTop: Spacing.md,
            lineHeight: Typography.size.xs * 1.6,
          }}
        >
          출처: 국내 동물병원 일반 권고 · AAFCO/ASPCA 가이드라인. 개체별 알러지·체질에 따라 반응이 다를 수 있으니 의심 증상이 있으면 수의사 상담을 권장해요.
        </Text>

        {/* 추후 카테고리 placeholder — 노출 안 함, 코멘트만 남김 */}
        {/* TODO: 백신 기본 일정, 첫 병원 방문 체크리스트, 사회화·산책 팁, 응급상황 대처 등 카테고리 확장. */}
      </ScrollView>
    </SafeAreaView>
  );
}
