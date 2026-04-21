import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/colors';
import type { PostSummary, PostTag } from '../api/communityApi';

const TAG_LABELS: Record<PostTag, string> = {
  SYMPTOM_SHARE: '#증상공유',
  HOSPITAL_REVIEW: '#병원후기',
  INFO_SHARE: '#정보공유',
};

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

interface Props {
  post: PostSummary;
  onPress: (postId: number) => void;
  liked?: boolean;
}

export function PostCard({ post, onPress, liked }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress(post.id)}
      className="bg-white rounded-2xl p-4 mb-3 border border-border">
      <View className="flex-row items-center mb-2">
        <View className="px-2 py-1 rounded-full mr-2" style={{ backgroundColor: Colors.primaryLight }}>
          <Text className="text-xs font-medium text-primary">{TAG_LABELS[post.tag]}</Text>
        </View>
        <Text className="text-xs text-text-tertiary ml-auto">{timeAgo(post.createdAt)}</Text>
      </View>

      <Text className="text-base font-semibold text-text-primary mb-1" numberOfLines={1}>
        {post.title}
      </Text>
      <Text className="text-sm text-text-secondary mb-3" numberOfLines={2}>
        {post.contentPreview}
      </Text>

      <View className="flex-row items-center">
        <Text className="text-xs text-text-tertiary flex-1">{post.authorName}</Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs" style={{ color: liked ? Colors.status.error : Colors.text.tertiary }}>
            ♥ {post.likeCount}
          </Text>
          <Text className="text-xs text-text-tertiary">💬 {post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
