import client from '../../../shared/api/client';
import type { PageResponse } from '../../../shared/api/types';

export type PostTag = 'SYMPTOM_SHARE' | 'HOSPITAL_REVIEW' | 'INFO_SHARE';

export interface PostSummary {
  id: number;
  tag: PostTag;
  title: string;
  contentPreview: string;
  authorNickname: string;
  authorProfileImage: string | null;
  thumbnailUrl: string | null;
  photoCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface PostPhoto {
  id: number;
  photoUrl: string;
  sortOrder: number;
}

export interface Post extends PostSummary {
  content: string;
  authorId: number;
  liked: boolean;
  photos: PostPhoto[];
}

export interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorNickname: string;
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

  uploadPhoto: (postId: number, uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('file', { uri, name: filename, type } as any);
    return client.post<PostPhoto>(`/api/posts/${postId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePhoto: (postId: number, photoId: number) =>
    client.delete<void>(`/api/posts/${postId}/photos/${photoId}`),
};
