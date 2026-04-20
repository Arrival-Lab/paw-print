import client from '../../../shared/api/client';
import type { PageResponse } from '../../../shared/api/types';

export type PostTag = 'SYMPTOM_SHARE' | 'HOSPITAL_REVIEW' | 'INFO_SHARE';

export interface PostSummary {
  id: number;
  tag: PostTag;
  title: string;
  contentPreview: string;
  authorName: string;
  authorProfileImage: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Post extends PostSummary {
  content: string;
  liked: boolean;
}

export interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorProfileImage: string | null;
  createdAt: string;
}

export interface PostRequest {
  title: string;
  content: string;
  tag: PostTag;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export const communityApi = {
  getPosts: (params?: { tag?: PostTag; keyword?: string; page?: number; size?: number }) =>
    client.get<PageResponse<PostSummary>>('/api/posts', { params }),

  createPost: (data: PostRequest) =>
    client.post<Post>('/api/posts', data),

  getPost: (postId: number) =>
    client.get<Post>(`/api/posts/${postId}`),

  deletePost: (postId: number) =>
    client.delete<void>(`/api/posts/${postId}`),

  getComments: (postId: number) =>
    client.get<Comment[]>(`/api/posts/${postId}/comments`),

  createComment: (postId: number, content: string) =>
    client.post<Comment>(`/api/posts/${postId}/comments`, { content }),

  deleteComment: (postId: number, commentId: number) =>
    client.delete<void>(`/api/posts/${postId}/comments/${commentId}`),

  toggleLike: (postId: number) =>
    client.post<LikeResponse>(`/api/posts/${postId}/like`),

  report: (postId: number, reason: string) =>
    client.post<void>(`/api/posts/${postId}/report`, { reason }),
};
