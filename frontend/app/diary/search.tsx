import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import PetSelector from '../../features/pet/components/PetSelector';
import { diaryApi } from '../../features/diary/api/diaryApi';
import { Colors, Spacing, Typography } from '../../constants';

const QUICK_TAGS = ['진료', '산책', '접종', '일상', '응급'];

export default function DiarySearchScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

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

  const handleSearch = () => {
    setKeyword(searchInput.trim());
  };

  const handleTagToggle = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          다이어리 검색
        </Text>
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {/* 검색 입력 */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <TextInput
            style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.full,
              paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
              fontSize: Typography.size.md, color: Colors.text.primary }}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            placeholder="키워드 검색"
            placeholderTextColor={Colors.text.disabled}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleSearch}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="search" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* 태그 필터 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.sm, paddingTop: Spacing.sm }}>
          {QUICK_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleTagToggle(tag)}
              style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                borderRadius: Spacing.borderRadius.full, borderWidth: 1,
                backgroundColor: activeTag === tag ? Colors.primary : Colors.white,
                borderColor: activeTag === tag ? Colors.primary : Colors.border }}>
              <Text style={{ fontSize: Typography.size.sm,
                color: activeTag === tag ? Colors.white : Colors.text.secondary }}>
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 결과 */}
      {!selectedPetId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
            반려동물을 선택해주세요
          </Text>
        </View>
      ) : !keyword && !activeTag ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="search" size={40} color={Colors.text.disabled} />
          <Text style={{ marginTop: Spacing.md, color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
            키워드나 태그로 검색해보세요
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxl }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xxxl }}>
              <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
                검색 결과가 없어요
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/diary/[date]',
                params: { date: item.diaryDate, petId: selectedPetId },
              })}
              style={{ backgroundColor: Colors.white, borderRadius: Spacing.borderRadius.lg,
                padding: Spacing.md, marginBottom: Spacing.sm,
                borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary,
                marginBottom: Spacing.xs }}>
                {item.diaryDate}
              </Text>
              {item.content && (
                <Text numberOfLines={2} style={{ fontSize: Typography.size.md,
                  color: Colors.text.primary, marginBottom: Spacing.xs }}>
                  {item.content}
                </Text>
              )}
              {item.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                  {item.tags.map((tag) => (
                    <View key={tag} style={{ backgroundColor: Colors.primaryLight,
                      borderRadius: Spacing.borderRadius.full,
                      paddingHorizontal: Spacing.sm, paddingVertical: 2 }}>
                      <Text style={{ fontSize: Typography.size.xs, color: Colors.primary }}>
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
