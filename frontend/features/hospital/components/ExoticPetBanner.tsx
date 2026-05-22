import { View, Text, Linking, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { Pet } from '../../pet/api/petApi';

interface Props {
  species: Pet['species'];
}

/** 특수동물(조류·파충류·소동물·기타)용 안내. 일반 동물병원 검색 화면 상단에 노출. */
export default function ExoticPetBanner({ species }: Props) {
  const Colors = useColors();

  const guide = SPECIES_GUIDE[species];
  if (!guide) return null;

  const naverSearch = async (term: string) => {
    const url = `https://map.naver.com/p/search/${encodeURIComponent(term)}`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: Colors.background,
        controlsColor: Colors.text.accent,
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      Linking.openURL(url);
    }
  };

  return (
    <View
      style={{
        backgroundColor: Colors.secondaryLight,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        <Feather name="alert-circle" size={16} color={Colors.text.primary} />
        <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>
          {guide.headline}
        </Text>
      </View>
      <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.md }}>
        {guide.body}
      </Text>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: Spacing.xs }}>
        네이버 지도에서 검색
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {guide.keywords.map((kw) => (
          <Pressable
            key={kw}
            onPress={() => naverSearch(kw)}
            style={{
              backgroundColor: Colors.white,
              borderRadius: Spacing.borderRadius.full,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.xs,
              borderWidth: 1,
              borderColor: Colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Feather name="external-link" size={11} color={Colors.text.secondary} />
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.primary }}>{kw}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const SPECIES_GUIDE: Partial<Record<Pet['species'], { headline: string; body: string; keywords: string[] }>> = {
  BIRD: {
    headline: '조류 진료 가능한 병원은 제한적이에요',
    body: '일반 동물병원에선 조류 진료가 어려운 경우가 많아요. 새 전문 또는 특수동물 병원을 미리 알아두세요.',
    keywords: ['조류 전문 동물병원', '새 동물병원', '특수동물 병원', '24시 특수동물'],
  },
  REPTILE: {
    headline: '파충류·양서류는 특수동물 병원으로',
    body: '일반 병원에선 진료 거절되거나 약물 용량을 가늠하기 어려워요. exotic animal·특수동물 전문을 우선 검색하세요.',
    keywords: ['파충류 동물병원', '특수동물 병원', 'exotic animal hospital', '양서류 진료'],
  },
  SMALL_ANIMAL: {
    headline: '햄스터·기니피그·토끼는 전문 병원이 안전해요',
    body: '소동물은 약물 반응이 강해서 일반 진료보다 특수동물 전문 의료진의 경험이 중요합니다.',
    keywords: ['특수동물 병원', '토끼 동물병원', '햄스터 진료', '기니피그 동물병원'],
  },
  OTHER: {
    headline: '특수동물 전문 병원을 미리 찾아두세요',
    body: '일반 동물병원에선 진료가 어려울 수 있어요. 종에 맞는 전문 병원을 미리 확인해두면 응급 시 시간을 줄일 수 있어요.',
    keywords: ['특수동물 병원', 'exotic animal hospital', '24시 특수동물'],
  },
};
