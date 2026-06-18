package com.qacollector.dto;

import lombok.Data;

@Data
public class PartnerConfirmRequest {
    /** Partner payment trade number (idempotency key) */
    private String tradeNo;
    /** Amount in fen, e.g. 2990 = ¥29.90 */
    private Integer amount;
    private String payerContact;
}
