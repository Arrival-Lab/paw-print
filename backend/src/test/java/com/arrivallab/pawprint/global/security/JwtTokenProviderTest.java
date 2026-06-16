package com.arrivallab.pawprint.global.security;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * JwtTokenProvider 의 issuer 검증.
 * 우리 비밀키로 서명됐더라도 우리가 발급한(issuer=pawprint) 토큰이 아니면 거부해야 한다.
 */
class JwtTokenProviderTest {

    // HMAC-SHA256 은 최소 256bit(32byte) 키 필요 — 충분히 긴 테스트용 시크릿.
    private static final String SECRET = "test-secret-key-that-is-long-enough-32+";

    private JwtTokenProvider provider;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "secret", SECRET);
        ReflectionTestUtils.setField(provider, "accessExpiration", 3_600_000L); // 1h
        provider.init();
        key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("우리 키로 서명됐지만 issuer 가 다른 토큰은 거부한다")
    void validateToken_rejectsTokenWithForeignIssuer() {
        Date now = new Date();
        String foreignToken = Jwts.builder()
                .subject("1")
                .issuer("evil")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 3_600_000L))
                .signWith(key)
                .compact();

        assertThatThrownBy(() -> provider.validateToken(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("issuer 는 맞지만 audience 가 다른 토큰은 거부한다")
    void validateToken_rejectsTokenWithForeignAudience() {
        Date now = new Date();
        String token = Jwts.builder()
                .issuer("pawprint")
                .audience().add("other-app").and()
                .subject("1")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 3_600_000L))
                .signWith(key)
                .compact();

        assertThatThrownBy(() -> provider.validateToken(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("우리가 발급한 토큰은(issuer=pawprint) 정상 검증되고 클레임을 읽을 수 있다")
    void validateToken_acceptsTokenIssuedByUs() {
        String token = provider.generateAccessToken(42L, "user@paw.print", SubscriptionType.FAMILY);

        assertThatCode(() -> provider.validateToken(token)).doesNotThrowAnyException();
        assertThat(provider.getUserIdFromToken(token)).isEqualTo(42L);
        assertThat(provider.getEmailFromToken(token)).isEqualTo("user@paw.print");
    }
}
