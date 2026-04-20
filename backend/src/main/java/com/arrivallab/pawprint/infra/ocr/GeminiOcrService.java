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

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    private static final String SYSTEM_PROMPT =
            "당신은 동물병원 처방전과 진료영수증을 분석하는 전문가입니다.";

    private static final String USER_PROMPT =
            "이 이미지에서 다음 정보를 추출해서 JSON 형식으로만 응답해줘. 다른 텍스트 없이 JSON만.\n" +
            "{ \"hospitalName\": string|null, \"visitedAt\": string|null (YYYY-MM-DD 형식), " +
            "\"symptoms\": string|null, \"diagnosis\": string|null, " +
            "\"treatment\": string|null, \"prescription\": string|null }\n" +
            "값이 없으면 null로 해줘.";

    @Value("${gemini.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final org.springframework.web.client.RestTemplate restTemplate =
            new org.springframework.web.client.RestTemplate();

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
                    "generationConfig", Map.of("maxOutputTokens", 500)
            );

            String url = GEMINI_URL + "?key=" + apiKey;
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

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
