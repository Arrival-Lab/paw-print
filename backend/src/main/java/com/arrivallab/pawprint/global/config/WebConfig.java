package com.arrivallab.pawprint.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // CORS는 SecurityConfig에서 처리. 추가 MVC 설정은 여기에.
}
