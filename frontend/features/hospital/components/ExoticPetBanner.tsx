import { useTranslation } from 'react-i18next';
import { View, Text, Linking, Pressable, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { Pet } from '../../pet/api/petApi';

interface ExoticGuide { headline: string; body: string; keywords: string[] }

interface Props {
  species: Pet['species'];
  /** 전달 시 우상단에 닫기(X) 버튼 노출. 사용자가 안내를 숨길 수 있게. */
  onDismiss?: () => void;
}

/** 특수동물(조류·파충류·소동물·기타)용 안내. 일반 동물병원 검색 화면 상단에 노출. */
export default function ExoticPetBanner({ species, onDismiss }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();

  // 일반종(DOG/CAT)은 키가 없어 문자열이 반환됨 → object 일 때만 노출.
  const raw = t(`hospital.exotic.${species}`, { returnObjects: true }) as unknown;
  const guide = raw && typeof raw === 'object' ? (raw as ExoticGuide) : null;
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
        <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, flex: 1 }}>
          {guide.headline}
        </Text>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} hitSlop={Spacing.hitSlop} accessibilityLabel={t('hospital.closeBanner')}>
            <Feather name="x" size={16} color={Colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.md }}>
        {guide.body}
      </Text>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: Spacing.xs }}>
        {t('hospital.naverSearch')}
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
