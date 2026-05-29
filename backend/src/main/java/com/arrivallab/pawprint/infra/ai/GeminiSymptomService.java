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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
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

    /**
     * Apple Guideline 1.4.1 (Safety — Physical Harm) 대응 — 모든 의학 정보 응답에
     * 공인 수의 정보원 citation 을 부착. 매 응답마다 동일 리스트가 채워진다.
     */
    private static final List<SymptomCheckResponse.Reference> REFERENCES = List.of(
            new SymptomCheckResponse.Reference(
                    "MSD Veterinary Manual (수의 매뉴얼)",
                    "https://www.msdvetmanual.com/"),
            new SymptomCheckResponse.Reference(
                    "AVMA — Pet Owner Resources",
                    "https://www.avma.org/resources-tools/pet-owners"),
            new SymptomCheckResponse.Reference(
                    "대한수의사회",
                    "https://www.kvma.or.kr/")
    );

    private static final String MSD_SEARCH_URL = "https://www.msdvetmanual.com/searchresults?query=";

    private static final String SYSTEM_PROMPT = """
            당신은 한국 반려동물 보호자를 돕는 차분한 가이드입니다.
            보호자가 관찰한 증상을 듣고 가능 원인 후보 3개 이내와 긴급도를 알려줍니다.
            의학적 단정·진단·처방을 절대 하지 않습니다.
            가능 원인은 MSD Veterinary Manual(merckvetmanual)·AVMA 같은 공인 수의 정보원에
            기재되어 있는 보편적 상태(예: gastritis, foreign body ingestion, IBD)만 제시하세요.
            보호자가 결정에 도움이 되도록 차분하고 짧게 답합니다.
            반드시 JSON 한 덩어리만 응답하세요. 마크다운·다른 텍스트 금지.
            """;

    /** Follow-up(챗봇 후속 질문) 전용 system prompt — 평문 응답, 컨텍스트 이어받기. */
    private static final String FOLLOWUP_SYSTEM_PROMPT = """
            당신은 한국 반려동물 보호자를 돕는 차분한 가이드입니다.
            초기 증상 체크에 이어서 보호자가 추가로 질문하는 흐름입니다.

            원칙:
            - 의학적 단정·진단·처방은 절대 하지 않습니다. "~일 수 있어요", "수의사 상담을 권합니다" 식의 조심스러운 표현.
            - 짧고 따뜻하게, 2~4문장. 마크다운·이모지 없이 평문.
            - 보호자가 행동에 옮길 수 있는 구체적 조언 또는 관찰 포인트를 1~2개 포함.
            - 응급 가능성(피, 발작, 호흡곤란, 의식 저하 등)이 새로 의심되면 즉시 동물병원 방문 권유.
            - 사료·약·용량 등 처방성 답변은 거절하고 수의사 상담을 권유.
            - 한국어로 답합니다.
            """;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(15);
    private static final long RETRY_BACKOFF_MS = 1500L;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) CONNECT_TIMEOUT.toMillis());
        factory.setReadTimeout((int) READ_TIMEOUT.toMillis());
        return new RestTemplate(factory);
    }

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
                            "temperature", 0.4,
                            // Gemini 2.5 Flash 는 기본적으로 thinking 토큰을 maxOutputTokens 한도에서
                            // 소비함 → 실제 출력이 잘리는 사례 발생. 증상 트리아지는 스키마 고정이라
                            // thinking 불필요. 0 으로 끄면 응답 속도 + 출력 토큰 마진 둘 다 확보.
                            "thinkingConfig", Map.of("thinkingBudget", 0)
                    )
            );

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            httpHeaders.set("x-goog-api-key", apiKey);

            Map<String, Object> response = postWithRetry(requestBody, httpHeaders);

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

    /**
     * 챗봇 후속 질문 처리. 초기 컨텍스트 + 대화 히스토리 + 새 질문을 받아 평문 답변 반환.
     *
     * @param petContext 초기 보호자 입력을 재구성한 텍스트 (펫 정보 + 증상 + 지속 시간 등)
     * @param history 지금까지 주고받은 turn (오래된 순서, 응급 가로채기는 서비스 레이어에서 이미 처리됨)
     * @param question 보호자의 새 질문
     * @return Gemini 답변 텍스트. 실패 시 안전한 폴백 문구.
     */
    public String followup(String petContext, List<ChatTurn> history, String question) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY not set, returning fallback symptom followup");
            return fallbackFollowupAnswer();
        }
        try {
            List<Map<String, Object>> contents = new ArrayList<>();
            // 첫 user turn = 초기 보호자 입력. 이전 체크 응답은 너무 길어서 통째로 넣지 않고,
            // history 가 들어 있으면 그 안에 ASSISTANT 요약 turn 으로 들어오는 걸 신뢰.
            contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", petContext))));
            if (history != null) {
                for (ChatTurn turn : history) {
                    String role = turn.role() == ChatTurn.Role.USER ? "user" : "model";
                    contents.add(Map.of("role", role, "parts", List.of(Map.of("text", turn.content()))));
                }
            }
            contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", question))));

            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", FOLLOWUP_SYSTEM_PROMPT))),
                    "contents", contents,
                    "generationConfig", Map.of(
                            "maxOutputTokens", 800,
                            "temperature", 0.5,
                            "thinkingConfig", Map.of("thinkingBudget", 0)
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            Map<String, Object> response = postWithRetry(requestBody, headers);
            String finishReason = extractFinishReason(response);
            String text = extractText(response);
            if (text == null || text.isBlank()) {
                log.warn("Gemini symptom followup returned empty text. finishReason={}", finishReason);
                return fallbackFollowupAnswer();
            }
            if (finishReason != null && !"STOP".equals(finishReason)) {
                log.warn("Gemini symptom followup finished abnormally. finishReason={}, textLen={}",
                        finishReason, text.length());
            }
            return text.trim();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Gemini symptom followup 4xx: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackFollowupAnswer();
        } catch (HttpServerErrorException e) {
            log.error("Gemini symptom followup 5xx: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackFollowupAnswer();
        } catch (Exception e) {
            log.error("Gemini symptom followup failed: {}", e.getMessage(), e);
            return fallbackFollowupAnswer();
        }
    }

    private String fallbackFollowupAnswer() {
        return "지금 AI가 답변을 만들 수 없어요. 잠시 후 다시 시도하시거나, 수의사 상담을 권해요.";
    }

    public record ChatTurn(Role role, String content) {
        public enum Role { USER, ASSISTANT }
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

    /** Public — 서비스 레이어에서 follow-up 질문에도 같은 키워드 가로채기를 재실행하기 위함. */
    public String matchEmergencyKeyword(String text) {
        if (text == null) return null;
        String lower = text.toLowerCase();
        for (String kw : EMERGENCY_KEYWORDS) {
            if (lower.contains(kw.toLowerCase())) return kw;
        }
        return null;
    }

    /** Public — follow-up 응답에도 동일 면책 문구를 붙이기 위함. */
    public String getDisclaimer() {
        return DISCLAIMER;
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
                null,
                REFERENCES
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
                null,
                REFERENCES
        );
    }

    /** Public — 서비스 레이어에서 follow-up 응답에 동일한 references 를 부착하기 위함. */
    public List<SymptomCheckResponse.Reference> getReferences() {
        return REFERENCES;
    }

    /**
     * 가능 원인 → MSD Veterinary Manual 검색 URL.
     * 정확한 페이지 URL 을 LLM 이 환각할 위험이 있어, 검색 URL 로만 안전하게 라우팅.
     */
    private String buildMsdSearchUrl(String causeName) {
        if (causeName == null || causeName.isBlank()) {
            return REFERENCES.get(0).url();
        }
        String encoded = URLEncoder.encode(causeName.trim(), StandardCharsets.UTF_8);
        return MSD_SEARCH_URL + encoded;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postWithRetry(Map<String, Object> body, HttpHeaders headers) {
        String url = String.format(GEMINI_URL_FORMAT, model);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            return restTemplate.postForObject(url, entity, Map.class);
        } catch (HttpServerErrorException | ResourceAccessException transientFailure) {
            log.warn("Gemini symptom check transient failure, retrying once after {}ms: {}",
                    RETRY_BACKOFF_MS, transientFailure.getMessage());
            try {
                Thread.sleep(RETRY_BACKOFF_MS);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw transientFailure;
            }
            return restTemplate.postForObject(url, entity, Map.class);
        }
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
                    String name = c.path("name").asText("");
                    causes.add(new SymptomCheckResponse.PossibleCause(
                            name,
                            prob,
                            c.path("description").asText(""),
                            buildMsdSearchUrl(name)));
                }
            }
            List<String> actions = new ArrayList<>();
            JsonNode actionsNode = node.path("recommendedActions");
            if (actionsNode.isArray()) {
                for (JsonNode a : actionsNode) actions.add(a.asText(""));
            }
            return new SymptomCheckResponse(urgency, reason, causes, actions, null, DISCLAIMER, null, REFERENCES);
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
