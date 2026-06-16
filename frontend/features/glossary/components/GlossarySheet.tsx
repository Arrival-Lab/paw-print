import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import { MedicalTerm, searchTerms, findTerm, MEDICAL_TERM_COUNT } from '../data/medicalTerms';
import { useGlossaryStore } from '../store/glossaryStore';

export default function GlossarySheet() {
  const { visible, initialQuery, close } = useGlossaryStore();
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MedicalTerm | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuery(initialQuery);
    const exact = initialQuery ? findTerm(initialQuery) : undefined;
    setSelected(exact ?? null);
  }, [visible, initialQuery]);

  const results = useMemo(() => searchTerms(query), [query, i18n.language]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <GlassOverlay onPress={close} style={{ justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: Colors.glass.border,
            maxHeight: '88%',
            minHeight: '60%',
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ backgroundColor: Colors.glass.surfaceStrong, paddingTop: Spacing.md, paddingBottom: padBottom, flex: 1 }}>
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
            <Pressable onPress={close} hitSlop={Spacing.hitSlop} style={{ position: 'absolute', top: Spacing.lg, right: Spacing.lg, zIndex: 1 }}>
              <Feather name="x" size={22} color={Colors.text.secondary} />
            </Pressable>

            <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
              <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.sm }}>
                {t('glossary.title')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.surface,
                  borderRadius: Spacing.borderRadius.md,
                  paddingHorizontal: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Feather name="search" size={16} color={Colors.text.tertiary} />
                <TextInput
                  value={query}
                  onChangeText={(t) => {
                    setQuery(t);
                    setSelected(null);
                  }}
                  placeholder={t('glossary.searchPlaceholder')}
                  placeholderTextColor={Colors.text.tertiary}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    paddingLeft: Spacing.sm,
                    color: Colors.text.primary,
                    ...Typography.preset.body,
                  }}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {selected ? (
              <TermDetail term={selected} onBack={() => setSelected(null)} />
            ) : (
              <TermList terms={results} onSelect={setSelected} />
            )}
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}

function TermList({ terms, onSelect }: { terms: MedicalTerm[]; onSelect: (term: MedicalTerm) => void }) {
  const Colors = useColors();
  const { t } = useTranslation();
  if (terms.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
        <Feather name="book-open" size={32} color={Colors.text.tertiary} />
        <Text style={{ ...Typography.preset.body, color: Colors.text.tertiary, marginTop: Spacing.sm, textAlign: 'center' }}>
          {t('glossary.empty', { count: MEDICAL_TERM_COUNT })}
        </Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl }}>
      {terms.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onSelect(item)}
          style={{
            paddingVertical: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{item.term}</Text>
            <View style={{ backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Spacing.borderRadius.full }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.accent }}>{item.category}</Text>
            </View>
          </View>
          <Text numberOfLines={2} style={{ marginTop: 4, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
            {item.definition}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function TermDetail({ term, onBack }: { term: MedicalTerm; onBack: () => void }) {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl }}>
      <Pressable onPress={onBack} hitSlop={Spacing.hitSlop} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
        <Feather name="chevron-left" size={18} color={Colors.text.secondary} />
        <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginLeft: 4 }}>{t('glossary.back')}</Text>
      </Pressable>

      <Text style={{ ...Typography.preset.h2, color: Colors.text.primary }}>{term.term}</Text>
      {term.aliases.length > 0 ? (
        <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, marginTop: 4 }}>
          {term.aliases.join(' · ')}
        </Text>
      ) : null}

      <View style={{ marginTop: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.lg }}>
        <Text style={{ ...Typography.preset.body, color: Colors.text.primary, lineHeight: Typography.size.md * Typography.lineHeight.relaxed }}>
          {term.definition}
        </Text>
      </View>

      {term.normalRange ? (
        <View style={{ marginTop: Spacing.lg }}>
          <Text style={{ ...Typography.preset.label, color: Colors.text.tertiary, marginBottom: Spacing.sm }}>{t('glossary.normalRange')}</Text>
          {term.normalRange.dog ? (
            <RangeRow species={t('species.DOG')} value={term.normalRange.dog} />
          ) : null}
          {term.normalRange.cat ? (
            <RangeRow species={t('species.CAT')} value={term.normalRange.cat} />
          ) : null}
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.sm }}>
            {t('glossary.rangeNote')}
          </Text>
        </View>
      ) : null}

      {term.tip ? (
        <View style={{ marginTop: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.primaryLight, borderRadius: Spacing.borderRadius.lg, flexDirection: 'row', gap: Spacing.sm }}>
          <Feather name="info" size={16} color={Colors.text.accent} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, ...Typography.preset.bodySmall, color: Colors.text.primary }}>{term.tip}</Text>
        </View>
      ) : null}

      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.xl, textAlign: 'center' }}>
        {t('glossary.disclaimer')}
      </Text>
    </ScrollView>
  );
}

function RangeRow({ species, value }: { species: string; value: string }) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
      <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>{species}</Text>
      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{value}</Text>
    </View>
  );
}
