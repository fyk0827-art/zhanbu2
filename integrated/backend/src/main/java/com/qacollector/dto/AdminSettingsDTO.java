package com.qacollector.dto;

import lombok.Data;

@Data
public class AdminSettingsDTO {
    private int quizQuestionCount;
    /** mock | live */
    private String paymentMode;
}
