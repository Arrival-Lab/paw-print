import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '../../../shared/hooks/useTheme';
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
  const Colors = useColors();

  return (
    <TouchableOpacity
      onPress={() => onPress(post.id)}
      style={{
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 9999,
            marginRight: 8,
            backgroundColor: Colors.primaryLight,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '500', color: Colors.primaryDark }}>
            {TAG_LABELS[post.tag]}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: Colors.text.tertiary, marginLeft: 'auto' }}>
          {timeAgo(post.createdAt)}
        </Text>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: 4 }} numberOfLines={1}>
        {post.title}
      </Text>
      <Text style={{ fontSize: 13, color: Colors.text.secondary, marginBottom: 12 }} numberOfLines={2}>
        {post.contentPreview}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: Colors.text.tertiary, flex: 1 }}>{post.authorName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 11, color: liked ? Colors.status.error : Colors.text.tertiary }}>
            ♥ {post.likeCount}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.text.tertiary }}>💬 {post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
