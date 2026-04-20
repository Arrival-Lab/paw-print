package com.arrivallab.pawprint.domain.community.service;

import com.arrivallab.pawprint.domain.community.dto.*;
import com.arrivallab.pawprint.domain.community.entity.*;
import com.arrivallab.pawprint.domain.community.repository.*;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository likeRepository;
    private final PostReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<PostSummaryDto> getPosts(PostTag tag, String keyword, int page, int size) {
        String kw = (keyword != null && keyword.isBlank()) ? null : keyword;
        return PageResponse.from(
                postRepository.findAll(tag, kw, PageRequest.of(page, size))
                        .map(PostSummaryDto::from)
        );
    }

    public PostDto createPost(Long userId, PostRequest request) {
        User user = getUser(userId);
        Post post = Post.builder()
                .user(user).title(request.title()).content(request.content()).tag(request.tag()).build();
        return PostDto.from(postRepository.save(post), false);
    }

    @Transactional(readOnly = true)
    public PostDto getPost(Long userId, Long postId) {
        Post post = getActivePost(postId);
        boolean liked = likeRepository.existsByPostIdAndUserId(postId, userId);
        return PostDto.from(post, liked);
    }

    public void deletePost(Long userId, Long postId) {
        Post post = getActivePost(postId);
        if (!post.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        post.delete();
    }

    public CommentDto createComment(Long userId, Long postId, CommentRequest request) {
        Post post = getActivePost(postId);
        User user = getUser(userId);
        Comment comment = Comment.builder().post(post).user(user).content(request.content()).build();
        commentRepository.save(comment);
        post.incrementComment();
        return CommentDto.from(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long postId) {
        getActivePost(postId);
        return commentRepository.findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(postId).stream()
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
}
