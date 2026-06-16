import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import { getForbiddenFoods } from '../features/food/constants/defaultForbiddenFoods';
import type { Pet } from '../features/pet/api/petApi';

type Species = Pet['species'];

const SPECIES_OPTIONS: { value: Species; paw: any }[] = [
  { value: 'CAT', paw: require('../assets/paws/cat.png') },
  { value: 'DOG', paw: require('../assets/paws/dog.png') },
  { value: 'BIRD', paw: require('../assets/paws/bird.png') },
  { value: 'REPTILE', paw: require('../assets/paws/reptile.png') },
  { value: 'SMALL_ANIMAL', paw: require('../assets/paws/small.png') },
];

export default function CareGuideScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const [species, setSpecies] = useState<Species>('CAT');

  const forbiddenFoods = useMemo(() => getForbiddenFoods(species), [species, t]);
  const speciesLabel = t(`species.${species}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title={t('care.guideTitle')} back hideEmergency />

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
            {t('care.petKind')}
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
                    {t(`species.${opt.value}`)}
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
              {t('care.dangerFoodTitle', { species: speciesLabel })}
            </Text>
          </View>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginBottom: Spacing.md }}>
            {t('care.dangerFoodDesc', { species: speciesLabel })}
          </Text>

          {forbiddenFoods.length === 0 ? (
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              {t('care.dangerFoodEmpty')}
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
                  {/* warningBg 는 라이트/다크 모두 옅은 노랑이라 다크모드에서 text.primary(밝은 잉크)와 충돌.
                      라이트/다크 동일한 진한 warning 색으로 고정해 대비 확보. */}
                  <Text
                    style={{
                      ...Typography.preset.caption,
                      color: Colors.status.warning,
                      fontWeight: Typography.weight.semibold,
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
          {t('care.guideSource')}
        </Text>

        {/* 추후 카테고리 placeholder — 노출 안 함, 코멘트만 남김 */}
        {/* TODO: 백신 기본 일정, 첫 병원 방문 체크리스트, 사회화·산책 팁, 응급상황 대처 등 카테고리 확장. */}
      </ScrollView>
    </SafeAreaView>
  );
}
