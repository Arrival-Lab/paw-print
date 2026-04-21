package com.arrivallab.pawprint.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class FcmConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @PostConstruct
    public void initialize() {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("FCM credentials path not configured — push notifications disabled");
            return;
        }
        try (InputStream stream = credentialsPath.stripLeading().startsWith("{")
                ? new ByteArrayInputStream(credentialsPath.getBytes(StandardCharsets.UTF_8))
                : new FileInputStream(credentialsPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(stream))
                    .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
        }
    }
}
