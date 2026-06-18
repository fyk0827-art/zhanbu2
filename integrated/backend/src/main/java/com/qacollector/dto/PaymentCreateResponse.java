package com.qacollector.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentCreateResponse {
    private String tradeNo;
    private BigDecimal amount;
    private String currency;
    private String status;
}
