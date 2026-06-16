import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const TAG_FILTER_VALUES: (PostTag | null)[] = [null, 'SYMPTOM_SHARE', 'HOSPITAL_REVIEW', 'INFO_SHARE'];

export default function CommunityScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  // 종별 빠른 검색 — 라벨/쿼리 i18n. 백엔드 키워드 검색에 query 그대로 위임.
  const speciesQuickSearch = t('community.quickSearch', { returnObjects: true }) as { label: string; query: string }[];
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
      showLoginPrompt(t('community.loginToWrite'));
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
          const msg = e?.response?.data?.message ?? t('community.createFailMsg');
          Alert.alert(t('community.createFailTitle'), msg);
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
            placeholder={t('community.searchPlaceholder')}
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
        {TAG_FILTER_VALUES.map((tag) => (
          <Chip
            key={String(tag)}
            label={tag ? t(`community.tag.${tag}`) : t('community.tagAll')}
            selected={activeTag === tag}
            onPress={() => setActiveTag(tag)}
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
        {speciesQuickSearch.map((s) => (
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
        <LoadingSpinner label={t('common.loading')} />
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="message-circle"
            title={t('community.emptyTitle')}
            description={t('community.emptyDesc')}
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

      <Fab onPress={handleWritePress} icon="edit-3" accessibilityLabel={t('community.write')} />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestCloseForm}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title={t('community.write')}
            back={requestCloseForm}
          />
          <PostForm onSubmit={handleSubmit} loading={isPending} onDirtyChange={setFormDirty} />
        </SafeAreaView>
      </Modal>

      <GlassHeader title={t('community.title')} back onHeightChange={setHeaderHeight} bottomSlot={searchAndFilters} />
    </View>
  );
}
