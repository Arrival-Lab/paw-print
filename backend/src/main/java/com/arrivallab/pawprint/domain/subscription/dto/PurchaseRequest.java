package com.arrivallab.pawprint.domain.subscription.dto;

import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
        @NotBlank String productId,
        @NotBlank String purchaseToken,
        @NotNull SubscriptionPlatform platform
) {}
