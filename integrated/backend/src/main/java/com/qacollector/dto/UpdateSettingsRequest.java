package com.qacollector.dto;

import lombok.Data;

@Data
public class UpdateSettingsRequest {
    private Integer quizQuestionCount;
    private String paymentMode;
}
