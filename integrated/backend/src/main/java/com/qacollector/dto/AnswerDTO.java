package com.qacollector.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnswerDTO {
    private Long id;
    private Long questionId;
    private String questionTitle;
    private Integer respondentAge;
    private String selectedOption;
    private LocalDateTime createdAt;
}
