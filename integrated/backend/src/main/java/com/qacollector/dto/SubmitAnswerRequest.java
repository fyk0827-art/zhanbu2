package com.qacollector.dto;

import lombok.Data;

@Data
public class SubmitAnswerRequest {
    private Long questionId;
    private Integer respondentAge;
    private String selectedOption;
}
