import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { usePosts, useCreatePost } from '../../features/community/hooks/useCommunity';
import { PostCard } from '../../features/community/components/PostCard';
import { PostForm } from '../../features/community/components/PostForm';
import type { PostTag, PostRequest } from '../../features/community/api/communityApi';

const TAG_FILTERS: { label: string; value: PostTag | null }[] = [
  { label: '전체', value: null },
  { label: '#증상공유', value: 'SYMPTOM_SHARE' },
  { label: '#병원후기', value: 'HOSPITAL_REVIEW' },
  { label: '#정보공유', value: 'INFO_SHARE' },
];

export default function CommunityScreen() {
  const [activeTag, setActiveTag] = useState<PostTag | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts(
    activeTag ?? undefined,
    keyword || undefined,
  );
  const { mutate: createPost, isPending } = useCreatePost();

  const posts = data?.pages.flatMap((p) => p.content) ?? [];

  const handleSubmit = (formData: PostRequest) => {
    createPost(formData, { onSuccess: () => setShowForm(false) });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View className="px-4 pt-2 pb-3 border-b border-border">
        <Text className="text-xl font-bold text-text-primary mb-3">커뮤니티</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setKeyword(searchInput.trim())}
          placeholder="검색"
          returnKeyType="search"
        />
      </View>

      {/* 태그 필터 */}
      <View className="flex-row px-4 pt-3 pb-2">
        {TAG_FILTERS.map((t) => {
          const active = activeTag === t.value;
          return (
            <TouchableOpacity
              key={String(t.value)}
              onPress={() => setActiveTag(t.value)}
              className="mr-4 pb-2"
              style={active ? { borderBottomWidth: 2, borderBottomColor: Colors.primary } : {}}>
              <Text
                className="text-sm font-medium"
                style={{ color: active ? Colors.primary : Colors.text.tertiary }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 게시글 목록 */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-tertiary text-sm">게시글이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => {}} />
          )}
          contentContainerClassName="px-4 pt-2 pb-24"
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} /> : null}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowForm(true)}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: Colors.primary }}>
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>

      {/* 게시글 작성 모달 */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <TouchableOpacity onPress={() => setShowForm(false)} className="mr-4">
              <Text className="text-text-secondary text-base">취소</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-text-primary">글쓰기</Text>
          </View>
          <PostForm onSubmit={handleSubmit} loading={isPending} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
