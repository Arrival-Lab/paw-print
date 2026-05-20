import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import PetSelector from '../../features/pet/components/PetSelector';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import { diaryApi } from '../../features/diary/api/diaryApi';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Chip from '../../shared/components/Chip';
import Card from '../../shared/components/Card';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Badge from '../../shared/components/Badge';

const QUICK_TAGS = ['진료', '산책', '접종', '일상', '응급'];

export default function DiarySearchScreen() {
  const Colors = useColors();
  // URL 파라미터 — 다이어리 카드/태그에서 진입 시 초기값 채워줌.
  const params = useLocalSearchParams<{ tag?: string; petId?: string }>();
  const setStorePetId = usePetFilterStore((s) => s.setSelectedPetId);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(
    params.petId ? Number(params.petId) : null,
  );
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(params.tag ?? null);

  // URL param 으로 진입한 펫을 PetSelector 가 사용하는 전역 스토어에도 반영.
  useEffect(() => {
    if (params.petId) setStorePetId(Number(params.petId));
  }, [params.petId, setStorePetId]);

  const { data, isLoading } = useQuery({
    queryKey: ['diary-search', selectedPetId, keyword, activeTag],
    queryFn: () =>
      diaryApi.search(selectedPetId!, {
        keyword: keyword || undefined,
        tags: activeTag || undefined,
      }),
    enabled: !!selectedPetId && (!!keyword || !!activeTag),
  });

  const results = data?.content ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="다이어리 검색" back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.full,
            paddingHorizontal: Spacing.md,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Feather name="search" size={16} color={Colors.text.tertiary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => setKeyword(searchInput.trim())}
            placeholder="키워드 검색"
            placeholderTextColor={Colors.text.tertiary}
            returnKeyType="search"
            style={{ flex: 1, fontSize: Typography.size.md, color: Colors.text.primary, padding: 0 }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.sm, paddingTop: Spacing.md }}
        >
          {QUICK_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              selected={activeTag === tag}
              onPress={() => setActiveTag((prev) => (prev === tag ? null : tag))}
            />
          ))}
        </ScrollView>
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : !keyword && !activeTag ? (
        <EmptyState
          icon="search"
          title="키워드나 태그로 검색해보세요"
          description="과거 다이어리에서 빠르게 찾아드려요"
          tone="muted"
        />
      ) : isLoading ? (
        <LoadingSpinner label="검색 중" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={<EmptyState icon="inbox" title="검색 결과가 없어요" tone="muted" />}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              padding="md"
              onPress={() =>
                router.push({ pathname: '/diary/[date]', params: { date: item.diaryDate, petId: selectedPetId } })
              }
            >
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: 4 }}>
                {item.diaryDate}
              </Text>
              {item.content ? (
                <Text numberOfLines={2} style={{ ...Typography.preset.body, color: Colors.text.primary, marginBottom: Spacing.sm }}>
                  {item.content}
                </Text>
              ) : null}
              {item.tags.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                  {item.tags.map((tag) => (
                    <Badge key={tag} tone="primary" size="sm">
                      #{tag}
                    </Badge>
                  ))}
                </View>
              ) : null}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
