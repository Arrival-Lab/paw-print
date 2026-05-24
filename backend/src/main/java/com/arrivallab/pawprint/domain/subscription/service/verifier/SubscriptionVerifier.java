package com.arrivallab.pawprint.domain.subscription.service.verifier;

import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;

/**
 * 결제 영수증 검증 전략. iOS/Android 등 플랫폼별 구현체가 등록되고
 * SubscriptionService 가 PurchaseRequest.platform() 으로 라우팅.
 *
 * 새 스토어 추가 = 새 구현체 @Component 추가 (SubscriptionService 수정 불필요).
 */
public interface SubscriptionVerifier {

    SubscriptionPlatform platform();

    VerifyResult verify(PurchaseRequest request);
}
