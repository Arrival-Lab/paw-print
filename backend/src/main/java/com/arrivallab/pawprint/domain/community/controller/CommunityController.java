package com.arrivallab.pawprint.domain.community.controller;

import com.arrivallab.pawprint.domain.community.dto.*;
import com.arrivallab.pawprint.domain.community.entity.PostTag;
import com.arrivallab.pawprint.domain.community.service.CommunityService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import com.arrivallab.pawprint.global.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryDto>>> getPosts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) PostTag tag,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(communityService.getPosts(userId, tag, keyword, page, size));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PostRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(communityService.createPost(userId, request));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDto>> getPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(communityService.getPost(userId, postId));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        communityService.deletePost(userId, postId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentDto>> createComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(communityService.createComment(userId, postId, request));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentDto>>> getComments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(communityService.getComments(userId, postId));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        communityService.deleteComment(userId, postId, commentId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> toggleLike(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(communityService.toggleLike(userId, postId));
    }

    @PostMapping("/{postId}/report")
    public ResponseEntity<ApiResponse<Void>> report(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @RequestBody ReportRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        communityService.report(userId, postId, request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{postId}/photos")
    public ResponseEntity<ApiResponse<PostPhotoDto>> addPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @RequestParam("file") MultipartFile file) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(communityService.addPhoto(userId, postId, file));
    }

    @DeleteMapping("/{postId}/photos/{photoId}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @PathVariable Long photoId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        communityService.deletePhoto(userId, postId, photoId);
        return ApiResponse.noContent();
    }
}
