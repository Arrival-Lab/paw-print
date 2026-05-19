import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi, PostRequest, PostTag } from '../api/communityApi';

export function usePosts(tag?: PostTag, keyword?: string) {
  return useInfiniteQuery({
    queryKey: ['posts', tag, keyword],
    queryFn: ({ pageParam = 0 }) =>
      communityApi.getPosts({ tag, keyword: keyword || undefined, page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });
}

export function usePost(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => communityApi.getPost(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, photoUris }: { data: PostRequest; photoUris: string[] }) => {
      const post = await communityApi.createPost(data);
      // 사진 1장이라도 실패하면 글까지 함께 롤백 (보상 트랜잭션).
      // 클라이언트 보상 — deletePost 자체가 실패하면 orphan post 가 남지만, 그땐 사용자가 본인 글이라 직접 삭제 가능.
      try {
        for (const uri of photoUris) {
          await communityApi.uploadPhoto(post.id, uri);
        }
      } catch (e) {
        try { await communityApi.deletePost(post.id); } catch {}
        throw e;
      }
      return post;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => communityApi.deletePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useComments(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => communityApi.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreateComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => communityApi.createComment(postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useToggleLike(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.toggleLike(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', postId] }),
  });
}

export function useReport(postId: number) {
  return useMutation({
    mutationFn: (reason: string) => communityApi.report(postId, reason),
  });
}
