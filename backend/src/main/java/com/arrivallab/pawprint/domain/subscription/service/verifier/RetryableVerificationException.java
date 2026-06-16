package com.arrivallab.pawprint.domain.subscription.service.verifier;

/**
 * 일시적(재시도하면 성공할 수 있는) 결제 검증 실패.
 * Google Play API 5xx/429 같은 서버측 일시 장애에 사용.
 *
 * 영구 실패(결제 상태 불일치, 잘못된 토큰/상품 = 4xx, 디코드 실패)는 {@code BusinessException} 으로
 * 구분한다. RTDN 웹훅은 이 둘을 보고 재시도 여부를 결정한다:
 *  - RetryableVerificationException → 5xx 반환 → Pub/Sub 재전송
 *  - 그 외(영구) → 200 ack → 무한 재전송 차단
 */
public class RetryableVerificationException extends RuntimeException {
    public RetryableVerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
