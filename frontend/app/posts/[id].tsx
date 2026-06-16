import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  Alert, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../features/auth/store/authStore';
import {
  usePost, useToggleLike, useComments, useCreateComment, useDeletePost, useReport,
} from '../../features/community/hooks/useCommunity';
import { communityApi } from '../../features/community/api/communityApi';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Badge from '../../shared/components/Badge';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { timeAgo } from '../../features/community/components/PostCard';

export default function PostDetailScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const currentUser = useAuthStore((s) => s.user);

  const { data: post, isLoading } = usePost(postId);
  const { data: comments = [], isLoading: commentsLoading } = useComments(postId);
  const { mutate: toggleLike } = useToggleLike(postId);
  const { mutate: createComment, isPending: commenting } = useCreateComment(postId);
  const { mutate: deletePost } = useDeletePost();
  const { mutate: report } = useReport(postId);

  const [commentText, setCommentText] = useState('');

  const reportDone = () => Alert.alert(t('community.reportDoneTitle'), t('community.reportDoneMsg'));
  const handleReport = () => {
    Alert.alert(t('community.reportTitle'), t('community.reportDesc'), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('community.reportSpam'), onPress: () => report(t('community.reportSpam'), { onSuccess: reportDone }) },
      { text: t('community.reportInappropriate'), onPress: () => report(t('community.reportInappropriate'), { onSuccess: reportDone }) },
      { text: t('community.reportMisinfo'), onPress: () => report(t('community.reportMisinfo'), { onSuccess: reportDone }) },
    ]);
  };

  const handleDeletePost = () => {
    Alert.alert(t('community.deletePostTitle'), t('record.deleteConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('action.delete'), style: 'destructive', onPress: () => deletePost(postId, { onSuccess: () => router.back() }) },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert(t('community.deleteCommentTitle'), t('community.deleteConfirmShort'), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('action.delete'), style: 'destructive', onPress: () => communityApi.deleteComment(postId, commentId) },
    ]);
  };

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    createComment(text, { onSuccess: () => setCommentText('') });
  };

  if (isLoading || !post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
        <ScreenHeader title={t('community.postTitle')} back />
        <LoadingSpinner label={t('common.loading')} />
      </SafeAreaView>
    );
  }

  const isOwner = currentUser?.id === post.authorId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title={t('community.postTitle')}
        back
        actions={[
          isOwner
            ? { icon: 'trash-2', label: t('action.delete'), onPress: handleDeletePost }
            : { icon: 'alert-circle', label: t('community.report'), onPress: handleReport },
        ]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxl }}>
          <View style={{ padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
              <Badge tone="primary" size="sm">#{t(`community.tag.${post.tag}`)}</Badge>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginLeft: 'auto' }}>
                {timeAgo(post.createdAt)}
              </Text>
            </View>

            <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, marginBottom: Spacing.sm }}>
              {post.title}
            </Text>
            <Text style={{ ...Typography.preset.body, color: Colors.text.primary, marginBottom: Spacing.lg }}>
              {post.content}
            </Text>

            {post.photos && post.photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.sm, marginBottom: Spacing.lg }}
              >
                {post.photos.map((photo) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.photoUrl }}
                    style={{ width: 200, height: 200, borderRadius: Spacing.borderRadius.md }}
                  />
                ))}
              </ScrollView>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: Spacing.md,
                borderTopWidth: 1,
                borderTopColor: Colors.border,
              }}
            >
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, flex: 1 }}>
                {post.authorNickname}
              </Text>
              <Pressable
                onPress={() => toggleLike()}
                hitSlop={Spacing.hitSlop}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: Spacing.lg }}
              >
                <Feather name="heart" size={18} color={post.liked ? Colors.status.error : Colors.text.tertiary} />
                <Text
                  style={{
                    ...Typography.preset.bodySmall,
                    color: post.liked ? Colors.status.error : Colors.text.tertiary,
                    fontWeight: Typography.weight.semibold,
                  }}
                >
                  {post.likeCount}
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="message-circle" size={18} color={Colors.text.tertiary} />
                <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary }}>
                  {post.commentCount}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ padding: Spacing.lg }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.md }}>
              {t('community.commentCount', { count: comments.length })}
            </Text>
            {commentsLoading ? (
              <LoadingSpinner inline label={t('common.loading')} />
            ) : comments.length === 0 ? (
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
                {t('community.firstComment')}
              </Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={{ marginBottom: Spacing.lg }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: Spacing.xs,
                    }}
                  >
                    <Text
                      style={{
                        ...Typography.preset.label,
                        color: Colors.text.primary,
                      }}
                    >
                      {comment.authorNickname}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                        {timeAgo(comment.createdAt)}
                      </Text>
                      {currentUser?.id === comment.authorId && (
                        <Pressable onPress={() => handleDeleteComment(comment.id)} hitSlop={Spacing.hitSlop}>
                          <Feather name="trash-2" size={14} color={Colors.text.tertiary} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>
                    {comment.content}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: Spacing.md,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            backgroundColor: Colors.white,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: Colors.surface,
              borderRadius: Spacing.borderRadius.full,
              paddingHorizontal: Spacing.md,
              paddingVertical: 10,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              marginRight: Spacing.sm,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={t('community.commentPlaceholder')}
            placeholderTextColor={Colors.text.tertiary}
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || commenting}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !commentText.trim() || commenting ? 0.4 : 1,
            }}
          >
            <Feather name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
