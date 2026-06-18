package com.lifeblueprint.domain;

public record OrderRecord(
        String id,
        String reportId,
        int amount,
        String title,
        String channel,
        OrderStatus status,
        String tradeNo,
        String payerContact,
        String location,
        long createdAt,
        Long paidAt
) {}
