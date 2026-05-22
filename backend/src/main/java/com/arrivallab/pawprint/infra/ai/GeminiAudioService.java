package com.arrivallab.pawprint.infra.ai;

import com.arrivallab.pawprint.domain.record.dto.MedicalRecordOcrResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Gemini multimodal 로 음성을 듣고 진료기록 필드를 prefill.
 * 보호자가 진료 후 차에서 5분 녹음 → 텍스트 → 병원/증상/진단/처방 자동 추출.
 *
 * OCR과 같은 응답 스키마(MedicalRecordOcrResponse) 재사용 — 프론트가 같은 prefill 흐름 탐.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiAudioService {

    private static final String GEMINI_URL_FORMAT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private static final String SYSTEM_PROMPT =
            "당신은 한국 동물병원 진료를 듣고 진료기록을 정리하는 비서입니다. " +
            "보호자가 진료 직후 녹음한 음성을 듣고 핵심 정보를 JSON으로만 정리합니다.";

    private static final String USER_PROMPT =
            "이 녹음에서 다음 정보를 추출해 JSON 한 덩어리로만 응답하세요. 다른 텍스트 금지.\n" +
            "{ \"hospitalName\": string|null, \"visitedAt\": string|null (YYYY-MM-DD), " +
            "\"symptoms\": string|null, \"diagnosis\": string|null, " +
            "\"treatment\": string|null, \"prescription\": string|null }\n" +
            "값이 명확하지 않으면 null. 추측·창작 금지. 사용자 발화 그대로 인용.";

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public MedicalRecordOcrResponse parseAudio(MultipartFile file) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY not set, returning empty audio response");
            return MedicalRecordOcrResponse.empty();
        }
        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = inferMimeType(file);

            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(
                                    Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64)),
                                    Map.of("text", USER_PROMPT)
                            )
                    )),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "maxOutputTokens", 600,
                            "temperature", 0.2
                    )
            );

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            httpHeaders.set("x-goog-api-key", apiKey);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    String.format(GEMINI_URL_FORMAT, model), new HttpEntity<>(requestBody, httpHeaders), Map.class);

            String text = extractText(response);
            return parseJson(text);
        } catch (IOException e) {
            log.error("Failed to read audio file", e);
            return MedicalRecordOcrResponse.empty();
        } catch (Exception e) {
            log.error("Gemini audio call failed", e);
            return MedicalRecordOcrResponse.empty();
        }
    }

    private String inferMimeType(MultipartFile file) {
        String ct = file.getContentType();
        if (ct != null && !ct.isBlank() && ct.startsWith("audio/")) return ct;
        String name = file.getOriginalFilename();
        if (name == null) return "audio/mp4";
        String lower = name.toLowerCase();
        if (lower.endsWith(".m4a") || lower.endsWith(".mp4") || lower.endsWith(".aac")) return "audio/mp4";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
        if (lower.endsWith(".flac")) return "audio/flac";
        return "audio/mp4";
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "";
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) return "";
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) return "";
        Object text = parts.get(0).get("text");
        return text == null ? "" : text.toString();
    }

    private MedicalRecordOcrResponse parseJson(String text) {
        if (text == null || text.isBlank()) return MedicalRecordOcrResponse.empty();
        try {
            JsonNode node = objectMapper.readTree(stripMarkdown(text.trim()));
            return new MedicalRecordOcrResponse(
                    textOrNull(node, "hospitalName"),
                    textOrNull(node, "visitedAt"),
                    textOrNull(node, "symptoms"),
                    textOrNull(node, "diagnosis"),
                    textOrNull(node, "treatment"),
                    textOrNull(node, "prescription"));
        } catch (Exception e) {
            log.warn("Failed to parse audio JSON: {}", text);
            return MedicalRecordOcrResponse.empty();
        }
    }

    private String stripMarkdown(String text) {
        if (text.startsWith("```json")) text = text.substring(7);
        else if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
        return text.trim();
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull() || v.asText().isBlank()) ? null : v.asText();
    }
}
