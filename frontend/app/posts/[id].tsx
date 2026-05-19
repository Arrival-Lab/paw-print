import React, { useState } from 'react';
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

const TAG_LABELS: Record<string, string> = {
  SYMPTOM_SHARE: '증상공유',
  HOSPITAL_REVIEW: '병원후기',
  INFO_SHARE: '정보공유',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function PostDetailScreen() {
  const Colors = useColors();
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

  const handleReport = () => {
    Alert.alert('신고', '신고 사유를 선택해주세요', [
      { text: '취소', style: 'cancel' },
      { text: '스팸·광고', onPress: () => report('스팸·광고', { onSuccess: () => Alert.alert('신고 완료', '신고가 접수되었습니다.') }) },
      { text: '부적절한 콘텐츠', onPress: () => report('부적절한 콘텐츠', { onSuccess: () => Alert.alert('신고 완료', '신고가 접수되었습니다.') }) },
      { text: '잘못된 정보', onPress: () => report('잘못된 정보', { onSuccess: () => Alert.alert('신고 완료', '신고가 접수되었습니다.') }) },
    ]);
  };

  const handleDeletePost = () => {
    Alert.alert('게시글 삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deletePost(postId, { onSuccess: () => router.back() }) },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('댓글 삭제', '삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => communityApi.deleteComment(postId, commentId) },
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
        <ScreenHeader title="게시글" back />
        <LoadingSpinner label="불러오는 중" />
      </SafeAreaView>
    );
  }

  const isOwner = currentUser?.id === post.authorId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="게시글"
        back
        actions={[
          isOwner
            ? { icon: 'trash-2', label: '삭제', onPress: handleDeletePost }
            : { icon: 'alert-circle', label: '신고', onPress: handleReport },
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
              <Badge tone="primary" size="sm">#{TAG_LABELS[post.tag]}</Badge>
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
              댓글 {comments.length}
            </Text>
            {commentsLoading ? (
              <LoadingSpinner inline label="불러오는 중" />
            ) : comments.length === 0 ? (
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
                첫 댓글을 남겨보세요
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
            placeholder="댓글을 입력하세요"
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
