package com.arrivallab.pawprint.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * 시간 소스를 빈으로 주입 가능하게 한다.
 * 운영에서는 시스템 시계, 테스트에서는 Clock.fixed(...) 로 교체해
 * 만료/경계 시점을 결정적으로 재현할 수 있다.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
