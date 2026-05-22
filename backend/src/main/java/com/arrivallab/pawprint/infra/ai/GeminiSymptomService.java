package com.arrivallab.pawprint.infra.ai;

import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckResponse;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Gemini Flash로 증상 → 가능 원인·긴급도 추정.
 *
 * 안전 장치:
 *  - 응급 키워드(피·경련·의식불명·발작 등)는 LLM 호출 전에 가로채서 즉시 IMMEDIATE 응답
 *  - LLM 응답이 비어있거나 파싱 실패하면 안전한 UNCLEAR 응답 + 병원 권유 폴백
 *  - 모든 응답에 면책 문구 포함
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiSymptomService {

    private static final String GEMINI_URL_FORMAT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    /** 즉시 응급 라우팅 키워드 — 발견 시 LLM 호출 없이 IMMEDIATE 응답. */
    private static final List<String> EMERGENCY_KEYWORDS = List.of(
            "피", "출혈", "혈변", "토혈", "혈뇨",
            "경련", "발작", "의식 없", "의식없", "쓰러", "실신",
            "호흡 곤란", "호흡곤란", "숨 못", "숨못", "청색증",
            "쇼크", "독약", "독을", "초콜릿 먹", "양파 먹", "포도 먹",
            "교통사고", "추락", "물림"
    );

    private static final String DISCLAIMER =
            "본 결과는 일반 정보를 바탕으로 한 참고용이에요. 수의사 진단을 대체할 수 없으며, " +
            "결정은 반드시 보호자와 수의사의 판단에 따라주세요.";

    private static final String SYSTEM_PROMPT = """
            당신은 한국 반려동물 보호자를 돕는 차분한 가이드입니다.
            보호자가 관찰한 증상을 듣고 가능 원인 후보 3개 이내와 긴급도를 알려줍니다.
            의학적 단정·진단·처방을 절대 하지 않습니다.
            보호자가 결정에 도움이 되도록 차분하고 짧게 답합니다.
            반드시 JSON 한 덩어리만 응답하세요. 마크다운·다른 텍스트 금지.
            """;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public SymptomCheckResponse check(String species, Integer ageYears,
                                       String symptoms, Integer durationHours, String additionalInfo) {
        // 1단계: 응급 키워드 가로채기 — 실패해서도 안 되는 안전 장치
        String emergencyMatch = matchEmergencyKeyword(symptoms);
        if (emergencyMatch != null) {
            return emergencyResponse(emergencyMatch);
        }

        // 2단계: API key 없으면 안전 폴백
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY not set, returning fallback symptom check");
            return fallbackResponse();
        }

        try {
            String userPrompt = buildUserPrompt(species, ageYears, symptoms, durationHours, additionalInfo);
            // OCR 와 동일하게 generationConfig 는 최소 옵션만 — responseMimeType 옵션이 일부
            // 모델 버전에서 400 거부되는 사례가 있어 제거. JSON 강제는 프롬프트로만.
            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", userPrompt))
                    )),
                    "generationConfig", Map.of(
                            "maxOutputTokens", 1500,
                            "temperature", 0.4
                    )
            );

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            httpHeaders.set("x-goog-api-key", apiKey);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    String.format(GEMINI_URL_FORMAT, model), new HttpEntity<>(requestBody, httpHeaders), Map.class);

            String finishReason = extractFinishReason(response);
            String text = extractText(response);
            if (text == null || text.isBlank()) {
                log.warn("Gemini symptom check returned empty text. finishReason={}, response={}", finishReason, response);
                return fallbackResponse();
            }
            if (finishReason != null && !"STOP".equals(finishReason)) {
                log.warn("Gemini symptom check finished abnormally. finishReason={}, textLen={}", finishReason, text.length());
            }
            return parseResponse(text);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Gemini symptom check 4xx: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackResponse();
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            log.error("Gemini symptom check 5xx: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackResponse();
        } catch (Exception e) {
            log.error("Gemini symptom check failed: {}", e.getMessage(), e);
            return fallbackResponse();
        }
    }

    private String buildUserPrompt(String species, Integer ageYears,
                                    String symptoms, Integer durationHours, String additionalInfo) {
        StringBuilder sb = new StringBuilder();
        sb.append("보호자 입력:\n");
        if (species != null) sb.append("- 종: ").append(species).append("\n");
        if (ageYears != null) sb.append("- 나이: ").append(ageYears).append("세\n");
        sb.append("- 증상: ").append(symptoms).append("\n");
        if (durationHours != null) sb.append("- 지속 시간: ").append(durationHours).append("시간\n");
        if (additionalInfo != null && !additionalInfo.isBlank()) {
            sb.append("- 추가 정보: ").append(additionalInfo).append("\n");
        }
        sb.append("""

                다음 JSON 스키마로만 응답하세요:
                {
                  "urgency": "IMMEDIATE" | "WITHIN_24H" | "OBSERVE" | "UNCLEAR",
                  "urgencyReason": "한 문장 한국어",
                  "possibleCauses": [
                    { "name": "원인명", "probability": 0-100 정수, "description": "한두 문장 설명" }
                  ],
                  "recommendedActions": ["보호자가 지금 할 수 있는 행동 1~4개"]
                }

                지침:
                - 가능 원인은 3개 이내. 추측이 어렵다면 1~2개만.
                - probability 합은 100을 넘지 않도록 (추정치임을 보호자가 이해할 수 있게).
                - 'IMMEDIATE'는 생명에 영향을 줄 수 있을 때만.
                - 'WITHIN_24H'는 하루 안에 진료가 필요할 때.
                - 'OBSERVE'는 집에서 1~2일 지켜봐도 되는 가벼운 사인일 때.
                - 'UNCLEAR'는 정보가 너무 부족할 때 — recommendedActions에서 어떤 정보를 더 보면 좋을지 안내.
                """);
        return sb.toString();
    }

    private String matchEmergencyKeyword(String text) {
        if (text == null) return null;
        String lower = text.toLowerCase();
        for (String kw : EMERGENCY_KEYWORDS) {
            if (lower.contains(kw.toLowerCase())) return kw;
        }
        return null;
    }

    private SymptomCheckResponse emergencyResponse(String keyword) {
        return new SymptomCheckResponse(
                SymptomCheckResponse.Urgency.IMMEDIATE,
                "입력하신 내용에 '" + keyword + "'가 포함되어 있어요. 즉시 가까운 동물병원이나 24시 응급실로 가주세요.",
                List.of(),
                List.of(
                        "지금 바로 가까운 24시 동물병원에 전화하기",
                        "이동 중에도 침착하게 — 호흡과 의식 상태를 계속 확인",
                        "토했거나 먹은 의심물질이 있다면 사진/포장을 챙겨가기"
                ),
                keyword,
                DISCLAIMER,
                null
        );
    }

    private SymptomCheckResponse fallbackResponse() {
        return new SymptomCheckResponse(
                SymptomCheckResponse.Urgency.UNCLEAR,
                "지금 AI가 답변을 만들 수 없어요. 직접 수의사 상담을 권해요.",
                List.of(),
                List.of(
                        "증상 사진/영상을 남기고 동물병원에 전화로 문의",
                        "물·사료 섭취 변화, 배변 상태를 기록",
                        "24시간 안에 호전이 없으면 진료 예약"
                ),
                null,
                DISCLAIMER,
                null
        );
    }

    @SuppressWarnings("unchecked")
    private String extractFinishReason(Map<String, Object> response) {
        if (response == null) return null;
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return null;
        Object reason = candidates.get(0).get("finishReason");
        return reason == null ? null : reason.toString();
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

    private SymptomCheckResponse parseResponse(String text) {
        if (text == null || text.isBlank()) return fallbackResponse();
        try {
            JsonNode node = objectMapper.readTree(stripMarkdown(text.trim()));
            SymptomCheckResponse.Urgency urgency = parseUrgency(node.path("urgency").asText("UNCLEAR"));
            String reason = textOrFallback(node, "urgencyReason",
                    "AI가 충분한 정보를 얻지 못했어요. 수의사 상담을 권합니다.");
            List<SymptomCheckResponse.PossibleCause> causes = new ArrayList<>();
            JsonNode causesNode = node.path("possibleCauses");
            if (causesNode.isArray()) {
                for (JsonNode c : causesNode) {
                    int prob = Math.max(0, Math.min(100, c.path("probability").asInt(0)));
                    causes.add(new SymptomCheckResponse.PossibleCause(
                            c.path("name").asText(""),
                            prob,
                            c.path("description").asText("")));
                }
            }
            List<String> actions = new ArrayList<>();
            JsonNode actionsNode = node.path("recommendedActions");
            if (actionsNode.isArray()) {
                for (JsonNode a : actionsNode) actions.add(a.asText(""));
            }
            return new SymptomCheckResponse(urgency, reason, causes, actions, null, DISCLAIMER, null);
        } catch (Exception e) {
            log.warn("Failed to parse symptom check JSON: {}", text);
            return fallbackResponse();
        }
    }

    private SymptomCheckResponse.Urgency parseUrgency(String s) {
        try {
            return SymptomCheckResponse.Urgency.valueOf(s);
        } catch (Exception e) {
            return SymptomCheckResponse.Urgency.UNCLEAR;
        }
    }

    private String stripMarkdown(String text) {
        if (text.startsWith("```json")) text = text.substring(7);
        else if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
        return text.trim();
    }

    private String textOrFallback(JsonNode node, String field, String fallback) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull() || v.asText().isBlank()) ? fallback : v.asText();
    }
}
