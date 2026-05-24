package com.arrivallab.pawprint.infra.ocr;

import com.arrivallab.pawprint.domain.record.dto.MedicalRecordOcrResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiOcrService {

    private static final String GEMINI_URL_FORMAT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private static final String SYSTEM_PROMPT =
            "당신은 동물병원 처방전과 진료영수증을 분석하는 전문가입니다.";

    private static final String USER_PROMPT =
            "이 이미지에서 다음 정보를 추출해줘. 값을 명확히 찾을 수 없으면 반드시 null. 추측 금지.\n" +
            "- hospitalName: 병원명\n" +
            "- visitedAt: 방문일 YYYY-MM-DD\n" +
            "- symptoms: 증상\n" +
            "- diagnosis: 진단명\n" +
            "- treatment: 처치/시술 요약\n" +
            "- prescription: 처방약 요약";

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private final ObjectMapper objectMapper;
    private final org.springframework.web.client.RestTemplate restTemplate;

    public MedicalRecordOcrResponse parseImage(MultipartFile file) {
        if (apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY not set, returning empty OCR response");
            return MedicalRecordOcrResponse.empty();
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of(
                            "parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(
                                    Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Image)),
                                    Map.of("text", USER_PROMPT)
                            )
                    )),
                    "generationConfig", Map.of(
                            "maxOutputTokens", 2000,
                            "responseMimeType", "application/json",
                            "responseSchema", Map.of(
                                    "type", "OBJECT",
                                    "properties", Map.of(
                                            "hospitalName", Map.of("type", "STRING", "nullable", true),
                                            "visitedAt", Map.of("type", "STRING", "nullable", true),
                                            "symptoms", Map.of("type", "STRING", "nullable", true),
                                            "diagnosis", Map.of("type", "STRING", "nullable", true),
                                            "treatment", Map.of("type", "STRING", "nullable", true),
                                            "prescription", Map.of("type", "STRING", "nullable", true)
                                    )
                            )
                    )
            );

            org.springframework.http.HttpHeaders httpHeaders = new org.springframework.http.HttpHeaders();
            httpHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            httpHeaders.set("x-goog-api-key", apiKey);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    String.format(GEMINI_URL_FORMAT, model),
                    new org.springframework.http.HttpEntity<>(requestBody, httpHeaders),
                    Map.class);

            String text = extractText(response);
            return parseJson(text);
        } catch (IOException e) {
            log.error("Failed to read file for OCR", e);
            return MedicalRecordOcrResponse.empty();
        } catch (Exception e) {
            log.error("Gemini OCR call failed", e);
            return MedicalRecordOcrResponse.empty();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    private MedicalRecordOcrResponse parseJson(String text) {
        try {
            String json = stripMarkdown(text.trim());
            JsonNode node = objectMapper.readTree(json);
            return new MedicalRecordOcrResponse(
                    textOrNull(node, "hospitalName"),
                    textOrNull(node, "visitedAt"),
                    textOrNull(node, "symptoms"),
                    textOrNull(node, "diagnosis"),
                    textOrNull(node, "treatment"),
                    textOrNull(node, "prescription")
            );
        } catch (Exception e) {
            log.warn("Failed to parse OCR JSON response: {}", text);
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
        JsonNode value = node.get(field);
        return (value == null || value.isNull()) ? null : value.asText();
    }
}
