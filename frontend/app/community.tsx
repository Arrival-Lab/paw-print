import React, { useState } from 'react';
import {
  View, TextInput, FlatList, Modal, ActivityIndicator, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import { confirmLeaveIfDirty } from '../shared/utils/confirmLeave';
import GlassHeader from '../shared/components/GlassHeader';
import Chip from '../shared/components/Chip';
import Fab from '../shared/components/Fab';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { usePosts, useCreatePost } from '../features/community/hooks/useCommunity';
import { useRefresh } from '../shared/hooks/useRefresh';
import { PostCard } from '../features/community/components/PostCard';
import TourTarget from '../shared/components/TourTarget';
import { TOUR_TARGETS } from '../shared/store/tourStore';
import { PostForm } from '../features/community/components/PostForm';
import type { PostTag, PostRequest } from '../features/community/api/communityApi';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';

const TAG_FILTERS: { label: string; value: PostTag | null }[] = [
  { label: '전체', value: null },
  { label: '증상공유', value: 'SYMPTOM_SHARE' },
  { label: '병원후기', value: 'HOSPITAL_REVIEW' },
  { label: '정보공유', value: 'INFO_SHARE' },
];

// 종별 빠른 검색 — 백엔드 키워드 검색에 그대로 위임. 특수동물 응답자가 찾기 쉽도록.
const SPECIES_QUICK_SEARCH: { label: string; query: string }[] = [
  { label: '강아지', query: '강아지' },
  { label: '고양이', query: '고양이' },
  { label: '조류·새', query: '조류' },
  { label: '파충류', query: '파충류' },
  { label: '소동물', query: '햄스터' },
  { label: '노견·시니어', query: '노견' },
];

export default function CommunityScreen() {
  const Colors = useColors();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [activeTag, setActiveTag] = useState<PostTag | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const isGuest = useAuthStore((s) => s.isGuest);
  const showLoginPrompt = useUiStore((s) => s.showLoginPrompt);

  const handleWritePress = () => {
    if (isGuest) {
      showLoginPrompt('글쓰기는 로그인이 필요해요');
      return;
    }
    setShowForm(true);
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts(
    activeTag ?? undefined,
    keyword || undefined,
  );
  const { mutate: createPost, isPending } = useCreatePost();
  const { refreshing, onRefresh } = useRefresh([['posts']]);

  const posts = data?.pages.flatMap((p) => p.content) ?? [];

  const closeForm = () => { setShowForm(false); setFormDirty(false); };
  const requestCloseForm = () => confirmLeaveIfDirty(formDirty, closeForm);

  const handleSubmit = (formData: PostRequest, photoUris: string[]) => {
    createPost(
      { data: formData, photoUris },
      {
        onSuccess: closeForm,
        onError: (e: any) => {
          const msg = e?.response?.data?.message ?? '사진 업로드 중 문제가 생겨 글을 등록하지 못했어요. 다시 시도해 주세요.';
          Alert.alert('등록 실패', msg);
        },
      },
    );
  };

  const searchAndFilters = (
    <View>
      <TourTarget
        tourId={TOUR_TARGETS.TAB_COMMUNITY}
        wrap
        style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            backgroundColor: Colors.glass.surfaceStrong,
            borderRadius: Spacing.borderRadius.full,
            paddingHorizontal: Spacing.md,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: Colors.glass.border,
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
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing.sm,
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing.sm,
          gap: Spacing.sm,
        }}
      >
        {SPECIES_QUICK_SEARCH.map((s) => (
          <Chip
            key={s.label}
            label={`# ${s.label}`}
            selected={keyword === s.query}
            onPress={() => {
              const next = keyword === s.query ? '' : s.query;
              setKeyword(next);
              setSearchInput(next);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="message-circle"
            title="게시글이 없어요"
            description="우측 하단 버튼으로 첫 글을 남겨보세요"
          />
        </View>
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
            paddingHorizontal: Spacing.xl,
            paddingTop: headerHeight + Spacing.sm,
            paddingBottom: Spacing.xxxxl,
          }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressViewOffset={headerHeight} />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.md }} />
            ) : null
          }
        />
      )}

      <Fab onPress={handleWritePress} icon="edit-3" accessibilityLabel="글쓰기" />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestCloseForm}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title="글쓰기"
            back={requestCloseForm}
          />
          <PostForm onSubmit={handleSubmit} loading={isPending} onDirtyChange={setFormDirty} />
        </SafeAreaView>
      </Modal>

      <GlassHeader title="커뮤니티" back onHeightChange={setHeaderHeight} bottomSlot={searchAndFilters} />
    </View>
  );
}
