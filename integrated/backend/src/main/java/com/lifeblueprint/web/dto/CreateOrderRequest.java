package com.lifeblueprint.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateOrderRequest(
        String reportId,
        String client,
        String payerContact,
        String reportType,
        String location
) {}
