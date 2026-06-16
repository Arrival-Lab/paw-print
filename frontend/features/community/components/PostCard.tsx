import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import i18n from '../../../shared/i18n';
import { Typography, Spacing } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { PostSummary } from '../api/communityApi';

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return i18n.t('community.justNow');
  if (min < 60) return i18n.t('community.minAgo', { count: min });
  const h = Math.floor(min / 60);
  if (h < 24) return i18n.t('community.hourAgo', { count: h });
  return i18n.t('community.dayAgo', { count: Math.floor(h / 24) });
}

interface Props {
  post: PostSummary;
  onPress: (postId: number) => void;
  liked?: boolean;
}

export function PostCard({ post, onPress, liked }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => onPress(post.id)}
      style={{
        backgroundColor: Colors.surfaceElevated,
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
          <Text style={{ ...Typography.preset.label, color: Colors.primaryDark }}>
            #{t(`community.tag.${post.tag}`)}
          </Text>
        </View>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginLeft: 'auto' }}>
          {timeAgo(post.createdAt)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: 4 }} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }} numberOfLines={2}>
            {post.contentPreview}
          </Text>
        </View>
        {post.thumbnailUrl && (
          <View>
            <Image
              source={{ uri: post.thumbnailUrl }}
              style={{ width: 64, height: 64, borderRadius: Spacing.borderRadius.sm }}
            />
            {post.photoCount > 1 && (
              <View
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: Colors.scrim,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Feather name="image" size={10} color={Colors.white} />
                <Text style={{ ...Typography.preset.caption, color: Colors.white }}>{post.photoCount}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, flex: 1 }}>{post.authorNickname}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ ...Typography.preset.caption, color: liked ? Colors.status.error : Colors.text.tertiary }}>
            ♥ {post.likeCount}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>💬 {post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
