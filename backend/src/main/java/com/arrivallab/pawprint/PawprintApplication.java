package com.arrivallab.pawprint;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableJpaAuditing
@EnableScheduling
public class PawprintApplication {

    public static void main(String[] args) {
        SpringApplication.run(PawprintApplication.class, args);
    }

    /**
     * JVM 기본 timezone 을 KST 로 고정 — ECS Linux 기본 TZ 가 UTC 라
     * LocalDateTime.now() 가 UTC 시간을 반환해 모든 createdAt 이 9시간 앞당겨져 저장됐었음
     * (커뮤니티 게시글 "9시간 전" 표시 버그). @JvmDefault timezone 으로 KST 강제.
     */
    @PostConstruct
    public void initTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }
}
