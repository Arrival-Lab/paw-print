package com.arrivallab.pawprint.domain.user.dto;

import jakarta.validation.constraints.Pattern;

/** 지원 언어만 허용 — 미지원 값은 400. */
public record LocaleRequest(@Pattern(regexp = "ko|en|ja", message = "지원하지 않는 언어입니다.") String locale) {}
