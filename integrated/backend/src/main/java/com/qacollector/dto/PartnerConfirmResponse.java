package com.qacollector.dto;

import lombok.Data;

@Data
public class PartnerConfirmResponse {
    private boolean ok;
    private Boolean alreadyConfirmed;
    private String orderId;
    private Boolean prepaid;
    private Boolean reportPending;
    private String frontendUrl;
    private Integer amount;
    private String amountDisplay;
    private String hint;
    private String tradeNo;
}
