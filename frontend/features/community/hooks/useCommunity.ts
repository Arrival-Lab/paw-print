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
      for (const uri of photoUris) {
        try {
          await communityApi.uploadPhoto(post.id, uri);
        } catch (e) {
          // 일부 사진 업로드가 실패해도 글 자체는 살아있음. 상세 화면에서 추가 업로드 가능.
        }
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
