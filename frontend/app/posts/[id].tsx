import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, FlatList,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../features/auth/store/authStore';
import {
  usePost, useToggleLike, useComments, useCreateComment, useDeletePost,
} from '../../features/community/hooks/useCommunity';
import { communityApi } from '../../features/community/api/communityApi';
import { Colors, Spacing, Typography } from '../../constants';

const TAG_LABELS: Record<string, string> = {
  SYMPTOM_SHARE: '#증상공유',
  HOSPITAL_REVIEW: '#병원후기',
  INFO_SHARE: '#정보공유',
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const currentUser = useAuthStore((s) => s.user);

  const { data: post, isLoading } = usePost(postId);
  const { data: comments = [], isLoading: commentsLoading } = useComments(postId);
  const { mutate: toggleLike } = useToggleLike(postId);
  const { mutate: createComment, isPending: commenting } = useCreateComment(postId);
  const { mutate: deletePost } = useDeletePost();

  const [commentText, setCommentText] = useState('');

  const handleDeletePost = () => {
    Alert.alert('게시글 삭제', '정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: () => deletePost(postId, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('댓글 삭제', '삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          await communityApi.deleteComment(postId, commentId);
        },
      },
    ]);
  };

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    createComment(text, { onSuccess: () => setCommentText('') });
  };

  if (isLoading || !post) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isOwner = currentUser && post.authorName === currentUser.name;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
            fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
            게시글
          </Text>
          {isOwner && (
            <TouchableOpacity onPress={handleDeletePost} hitSlop={8}>
              <Feather name="trash-2" size={20} color={Colors.status.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxl }}>
          {/* 게시글 본문 */}
          <View style={{ padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
              <View style={{ paddingHorizontal: Spacing.sm, paddingVertical: 4,
                borderRadius: Spacing.borderRadius.full, backgroundColor: Colors.primaryLight,
                marginRight: Spacing.sm }}>
                <Text style={{ fontSize: Typography.size.xs, color: Colors.primary,
                  fontWeight: Typography.weight.medium }}>
                  {TAG_LABELS[post.tag]}
                </Text>
              </View>
              <Text style={{ fontSize: Typography.size.xs, color: Colors.text.tertiary, marginLeft: 'auto' }}>
                {timeAgo(post.createdAt)}
              </Text>
            </View>

            <Text style={{ fontSize: Typography.size.xl, fontWeight: Typography.weight.bold,
              color: Colors.text.primary, marginBottom: Spacing.md }}>
              {post.title}
            </Text>
            <Text style={{ fontSize: Typography.size.md, color: Colors.text.primary,
              lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
              marginBottom: Spacing.lg }}>
              {post.content}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center',
              paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }}>
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary, flex: 1 }}>
                {post.authorName}
              </Text>
              <TouchableOpacity
                onPress={() => toggleLike()}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: Spacing.lg }}>
                <Feather
                  name="heart"
                  size={18}
                  color={post.liked ? Colors.status.error : Colors.text.tertiary}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ fontSize: Typography.size.sm,
                  color: post.liked ? Colors.status.error : Colors.text.tertiary }}>
                  {post.likeCount}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="message-circle" size={18} color={Colors.text.tertiary}
                  style={{ marginRight: 4 }} />
                <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary }}>
                  {post.commentCount}
                </Text>
              </View>
            </View>
          </View>

          {/* 댓글 목록 */}
          <View style={{ padding: Spacing.lg }}>
            <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
              color: Colors.text.primary, marginBottom: Spacing.md }}>
              댓글 {comments.length}
            </Text>
            {commentsLoading
              ? <ActivityIndicator color={Colors.primary} />
              : comments.length === 0
                ? <Text style={{ fontSize: Typography.size.sm, color: Colors.text.tertiary }}>
                    첫 댓글을 남겨보세요
                  </Text>
                : comments.map((comment) => (
                    <View key={comment.id} style={{ marginBottom: Spacing.lg }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
                          color: Colors.text.primary }}>
                          {comment.authorName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                          <Text style={{ fontSize: Typography.size.xs, color: Colors.text.tertiary }}>
                            {timeAgo(comment.createdAt)}
                          </Text>
                          {currentUser?.name === comment.authorName && (
                            <TouchableOpacity onPress={() => handleDeleteComment(comment.id)} hitSlop={8}>
                              <Feather name="trash-2" size={14} color={Colors.text.tertiary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <Text style={{ fontSize: Typography.size.md, color: Colors.text.primary,
                        lineHeight: Typography.size.md * Typography.lineHeight.normal }}>
                        {comment.content}
                      </Text>
                    </View>
                  ))}
          </View>
        </ScrollView>

        {/* 댓글 입력 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
          borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white }}>
          <TextInput
            style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.full,
              paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
              fontSize: Typography.size.md, color: Colors.text.primary, marginRight: Spacing.sm }}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="댓글을 입력하세요"
            placeholderTextColor={Colors.text.disabled}
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || commenting}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center',
              opacity: !commentText.trim() || commenting ? 0.4 : 1 }}>
            {commenting
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Feather name="send" size={18} color={Colors.white} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
