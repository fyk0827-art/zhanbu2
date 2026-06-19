package com.lifeblueprint.domain;

public record OrderAttribution(
        String orderId,
        String clientIp,
        String userAgent,
        String fbp,
        String fbc,
        String eventSourceUrl,
        long createdAt
) {}
