package com.arrivallab.pawprint.domain.subscription.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Google Cloud Pub/Sub push subscription 이 보내는 envelope.
 * docs: https://cloud.google.com/pubsub/docs/push#receive_push
 *
 * 예시:
 * {
 *   "message": {
 *     "data": "<base64-encoded JSON>",
 *     "messageId": "...",
 *     "publishTime": "..."
 *   },
 *   "subscription": "projects/.../subscriptions/..."
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PubSubPushBody(PubSubMessage message, String subscription) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PubSubMessage(
            String data,
            String messageId,
            String publishTime,
            Map<String, String> attributes
    ) {}
}
