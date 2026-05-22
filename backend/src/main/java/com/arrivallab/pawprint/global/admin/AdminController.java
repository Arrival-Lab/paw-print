package com.arrivallab.pawprint.global.admin;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * ⚠️ 임시 일회성 운영 endpoint — 스토어 검토 대비 PREMIUM 부여용.
 * 사용 직후 이 파일 통째로 삭제하고 SecurityConfig 의 /api/admin/grant-premium permitAll 도 함께 제거할 것.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    // 시크릿 — 한 번 쓰고 컨트롤러째 삭제하므로 git history 잔류해도 즉시 무효화됨.
    private static final String SECRET = "PP_GRANT_8f3a91d2c4b7e6a05d1f9c8b2e4a7f6d3";

    private final UserRepository userRepository;

    @PostMapping("/grant-premium")
    @Transactional
    public ResponseEntity<ApiResponse<String>> grantPremium(@RequestBody GrantRequest req) {
        if (req.secret() == null || !SECRET.equals(req.secret())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateSubscription(SubscriptionType.PREMIUM, LocalDateTime.of(2099, 12, 31, 23, 59));
        return ApiResponse.ok("granted PREMIUM to " + req.email() + " (id=" + user.getId() + ")");
    }

    public record GrantRequest(String email, String secret) {}
}
