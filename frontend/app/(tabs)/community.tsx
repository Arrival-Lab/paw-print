import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, Modal, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Chip from '../../shared/components/Chip';
import Fab from '../../shared/components/Fab';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { usePosts, useCreatePost } from '../../features/community/hooks/useCommunity';
import { useRefresh } from '../../shared/hooks/useRefresh';
import { PostCard } from '../../features/community/components/PostCard';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';
import { PostForm } from '../../features/community/components/PostForm';
import type { PostTag, PostRequest } from '../../features/community/api/communityApi';

const TAG_FILTERS: { label: string; value: PostTag | null }[] = [
  { label: '전체', value: null },
  { label: '증상공유', value: 'SYMPTOM_SHARE' },
  { label: '병원후기', value: 'HOSPITAL_REVIEW' },
  { label: '정보공유', value: 'INFO_SHARE' },
];

export default function CommunityScreen() {
  const Colors = useColors();
  const [activeTag, setActiveTag] = useState<PostTag | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts(
    activeTag ?? undefined,
    keyword || undefined,
  );
  const { mutate: createPost, isPending } = useCreatePost();
  const { refreshing, onRefresh } = useRefresh([['posts']]);

  const posts = data?.pages.flatMap((p) => p.content) ?? [];

  const handleSubmit = (formData: PostRequest) => {
    createPost(formData, { onSuccess: () => setShowForm(false) });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="커뮤니티" />

      <TourTarget
        tourId={TOUR_TARGETS.TAB_COMMUNITY}
        wrap
        style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}
      >
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
            placeholder="검색어를 입력하세요"
            placeholderTextColor={Colors.text.tertiary}
            returnKeyType="search"
            style={{
              flex: 1,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              padding: 0,
            }}
          />
        </View>
      </TourTarget>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
          gap: Spacing.sm,
        }}
      >
        {TAG_FILTERS.map((t) => (
          <Chip
            key={String(t.value)}
            label={t.label}
            selected={activeTag === t.value}
            onPress={() => setActiveTag(t.value)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title="게시글이 없어요"
          description="우측 하단 버튼으로 첫 글을 남겨보세요"
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={(id) => router.push({ pathname: '/posts/[id]', params: { id } })}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.sm,
            paddingBottom: 120,
          }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.md }} />
            ) : null
          }
        />
      )}

      <Fab onPress={() => setShowForm(true)} icon="edit-3" accessibilityLabel="글쓰기" />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title="글쓰기"
            back={() => setShowForm(false)}
          />
          <PostForm onSubmit={handleSubmit} loading={isPending} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
