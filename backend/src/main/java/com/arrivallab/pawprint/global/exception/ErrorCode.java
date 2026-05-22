package com.arrivallab.pawprint.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 402 - Premium required
    PREMIUM_REQUIRED(HttpStatus.PAYMENT_REQUIRED, "프리미엄 구독이 필요한 기능입니다."),
    PET_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 최대 3마리까지 등록 가능합니다."),
    OCR_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 월 5회까지 OCR을 사용할 수 있습니다."),
    AI_CHECK_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 월 5회까지 AI 증상 체크를 사용할 수 있습니다."),
    ATTACHMENT_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 사진을 건당 5장까지 첨부할 수 있습니다."),
    PHOTO_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 사진을 건당 5장까지 첨부할 수 있습니다."),
    VACCINE_ALERT_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 예방접종 알림을 3개까지 설정할 수 있습니다."),
    SHARE_LIMIT_EXCEEDED(HttpStatus.PAYMENT_REQUIRED, "무료 플랜은 1명까지 공유할 수 있습니다."),

    // 400 - Bad Request
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "파일 크기는 10MB를 초과할 수 없습니다."),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 파일 형식입니다."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    INVALID_NICKNAME(HttpStatus.BAD_REQUEST, "닉네임은 2~20자, 한글·영문·숫자만 사용할 수 있어요."),
    NICKNAME_DUPLICATED(HttpStatus.BAD_REQUEST, "이미 사용 중인 닉네임이에요."),
    NICKNAME_REQUIRED(HttpStatus.BAD_REQUEST, "닉네임을 먼저 설정해 주세요."),

    // 401 - Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),

    // 403 - Forbidden
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // 404 - Not Found
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    PET_NOT_FOUND(HttpStatus.NOT_FOUND, "반려동물을 찾을 수 없습니다."),
    RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "진료기록을 찾을 수 없습니다."),

    // 400 - Purchase
    PURCHASE_VERIFICATION_FAILED(HttpStatus.BAD_REQUEST, "결제 검증에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
