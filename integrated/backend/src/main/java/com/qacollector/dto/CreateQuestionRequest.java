package com.qacollector.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateQuestionRequest {
    private Long ageGroupId;
    private Boolean isActive;
    private List<TranslationDTO> translations;
    private List<OptionDTO> options;
}
