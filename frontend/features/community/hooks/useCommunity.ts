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
    mutationFn: (data: PostRequest) => communityApi.createPost(data),
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
