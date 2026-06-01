package com.arrivallab.pawprint.domain.subscription.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Google Play Real-time Developer Notifications (RTDN) 페이로드.
 * Pub/Sub message.data 를 base64 디코드한 결과.
 *
 * docs: https://developer.android.com/google/play/billing/rtdn-reference
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleDeveloperNotification(
        String version,
        String packageName,
        String eventTimeMillis,
        SubscriptionNotification subscriptionNotification,
        OneTimeProductNotification oneTimeProductNotification,
        TestNotification testNotification
) {

    /**
     * notificationType 코드:
     * 1=RECOVERED, 2=RENEWED, 3=CANCELED, 4=PURCHASED, 5=ON_HOLD,
     * 6=IN_GRACE_PERIOD, 7=RESTARTED, 8=PRICE_CHANGE_CONFIRMED, 9=DEFERRED,
     * 10=PAUSED, 11=PAUSE_SCHEDULE_CHANGED, 12=REVOKED, 13=EXPIRED, 20=PENDING_PURCHASE_CANCELED
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SubscriptionNotification(
            String version,
            int notificationType,
            String purchaseToken,
            String subscriptionId
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OneTimeProductNotification(
            String version,
            int notificationType,
            String purchaseToken,
            String sku
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TestNotification(String version) {}
}
