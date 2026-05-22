package com.arrivallab.pawprint.domain.community.service;

import com.arrivallab.pawprint.domain.community.dto.*;
import com.arrivallab.pawprint.domain.community.entity.*;
import com.arrivallab.pawprint.domain.community.repository.*;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.domain.user.service.UserBlockService;
import com.arrivallab.pawprint.global.constants.FreeLimits;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.PageResponse;
import com.arrivallab.pawprint.infra.storage.FileDirectory;
import com.arrivallab.pawprint.infra.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository likeRepository;
    private final PostReportRepository reportRepository;
    private final PostPhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final UserBlockService userBlockService;

    @Transactional(readOnly = true)
    public PageResponse<PostSummaryDto> getPosts(Long userId, PostTag tag, String keyword, int page, int size) {
        // Postgres 42P18 회피 — boolean flag + non-null placeholder.
        boolean tagFilter = tag != null;
        PostTag tagValue = tagFilter ? tag : PostTag.SYMPTOM_SHARE; // placeholder, tagFilter=false 면 무시됨
        boolean keywordFilter = keyword != null && !keyword.isBlank();
        String keywordPattern = keywordFilter ? "%" + keyword + "%" : "%";
        var posts = postRepository.findAll(tagValue, tagFilter, keywordPattern, keywordFilter,
                blockedIdsSafe(userId), PageRequest.of(page, size));
        List<Long> postIds = posts.getContent().stream().map(Post::getId).toList();
        Map<Long, List<PostPhoto>> photosByPostId = postIds.isEmpty()
                ? Map.of()
                : photoRepository.findByPostIdInOrderBySortOrderAsc(postIds).stream()
                        .collect(Collectors.groupingBy(p -> p.getPost().getId()));
        return PageResponse.from(posts.map(p -> {
            List<PostPhoto> ps = photosByPostId.getOrDefault(p.getId(), List.of());
            String thumb = ps.isEmpty() ? null : ps.get(0).getPhotoUrl();
            return PostSummaryDto.from(p, thumb, ps.size());
        }));
    }

    /**
     * 빈 IN 절은 PostgreSQL 에서 syntax error. 차단 목록이 비었으면 sentinel(-1L)로 채워 NOT IN 무효화.
     */
    private List<Long> blockedIdsSafe(Long userId) {
        List<Long> ids = new ArrayList<>(userBlockService.getBlockedIds(userId));
        if (ids.isEmpty()) ids.add(-1L);
        return ids;
    }

    public PostDto createPost(Long userId, PostRequest request) {
        User user = getUser(userId);
        requireNickname(user);
        Post post = Post.builder()
                .user(user).title(request.title()).content(request.content()).tag(request.tag()).build();
        return PostDto.from(postRepository.save(post), false);
    }

    @Transactional(readOnly = true)
    public PostDto getPost(Long userId, Long postId) {
        Post post = getActivePost(postId);
        boolean liked = likeRepository.existsByPostIdAndUserId(postId, userId);
        List<PostPhoto> photos = photoRepository.findByPostIdOrderBySortOrderAsc(postId);
        return PostDto.from(post, liked, photos);
    }

    public void deletePost(Long userId, Long postId) {
        Post post = getActivePost(postId);
        if (!post.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        photoRepository.findByPostIdOrderBySortOrderAsc(postId)
                .forEach(p -> fileStorageService.delete(p.getPhotoUrl()));
        post.delete();
    }

    public PostPhotoDto addPhoto(Long userId, Long postId, MultipartFile file) {
        Post post = getActivePost(postId);
        if (!post.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);

        User user = getUser(userId);
        if (user.getSubscriptionType() == SubscriptionType.FREE
                && photoRepository.countByPost(post) >= FreeLimits.MAX_PHOTOS_PER_ITEM) {
            throw new BusinessException(ErrorCode.PHOTO_LIMIT_EXCEEDED);
        }

        String url = fileStorageService.upload(file, FileDirectory.POST_PHOTO.getPath());
        int nextOrder = photoRepository.findMaxSortOrderByPostId(postId) + 1;

        PostPhoto photo = PostPhoto.builder()
                .post(post)
                .photoUrl(url)
                .sortOrder(nextOrder)
                .build();
        return PostPhotoDto.from(photoRepository.save(photo));
    }

    public void deletePhoto(Long userId, Long postId, Long photoId) {
        Post post = getActivePost(postId);
        if (!post.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        PostPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!photo.getPost().getId().equals(postId)) throw new BusinessException(ErrorCode.NOT_FOUND);
        fileStorageService.delete(photo.getPhotoUrl());
        photoRepository.delete(photo);
    }

    public CommentDto createComment(Long userId, Long postId, CommentRequest request) {
        Post post = getActivePost(postId);
        User user = getUser(userId);
        requireNickname(user);
        Comment comment = Comment.builder().post(post).user(user).content(request.content()).build();
        commentRepository.save(comment);
        post.incrementComment();
        return CommentDto.from(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long userId, Long postId) {
        getActivePost(postId);
        return commentRepository.findVisibleByPostId(postId, blockedIdsSafe(userId)).stream()
                .map(CommentDto::from).toList();
    }

    public void deleteComment(Long userId, Long postId, Long commentId) {
        Post post = getActivePost(postId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!comment.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        comment.delete();
        post.decrementComment();
    }

    public LikeResponse toggleLike(Long userId, Long postId) {
        Post post = getActivePost(postId);
        User user = getUser(userId);
        return likeRepository.findByPostIdAndUserId(postId, userId)
                .map(like -> {
                    likeRepository.delete(like);
                    post.decrementLike();
                    return new LikeResponse(false, post.getLikeCount());
                })
                .orElseGet(() -> {
                    likeRepository.save(PostLike.builder().post(post).user(user).build());
                    post.incrementLike();
                    return new LikeResponse(true, post.getLikeCount());
                });
    }

    public void report(Long userId, Long postId, ReportRequest request) {
        Post post = getActivePost(postId);
        User reporter = getUser(userId);
        reportRepository.save(PostReport.builder()
                .post(post).reporter(reporter).reason(request.reason()).build());
    }

    private Post getActivePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (post.getIsDeleted()) throw new BusinessException(ErrorCode.NOT_FOUND);
        return post;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private void requireNickname(User user) {
        if (user.getNickname() == null || user.getNickname().isBlank()) {
            throw new BusinessException(ErrorCode.NICKNAME_REQUIRED);
        }
    }
}
