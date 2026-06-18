package com.qacollector.dto;

import lombok.Data;

@Data
public class PaymentCompleteResponse {
    private String tradeNo;
    private String status;
    private String orderId;
    private String frontendUrl;
}
