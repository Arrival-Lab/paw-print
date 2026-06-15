package com.arrivallab.pawprint.global.exception;

import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /** error.<code> 를 현재 로케일로 해석. 키 누락 시 defaultMessage(한국어)로 폴백. */
    private String localized(String code, String defaultMessage) {
        return messageSource.getMessage(code, null, defaultMessage, LocaleContextHolder.getLocale());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        log.warn("BusinessException [{}] {}", e.getErrorCode().name(), e.getMessage());
        String message = localized("error." + e.getErrorCode().name(), e.getMessage());
        return ApiResponse.error(e.getErrorCode().getHttpStatus(), message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("입력값이 올바르지 않습니다.");
        log.warn("Validation failed: {}", message);
        return ApiResponse.error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        return ApiResponse.error(HttpStatus.FORBIDDEN, localized("error.FORBIDDEN", ErrorCode.FORBIDDEN.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Unexpected error", e);
        return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR,
                localized("error.internal", "서버 내부 오류가 발생했습니다."));
    }
}
