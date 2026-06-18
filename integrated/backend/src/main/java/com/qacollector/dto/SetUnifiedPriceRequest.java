package com.qacollector.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SetUnifiedPriceRequest {
    private BigDecimal price;
}
