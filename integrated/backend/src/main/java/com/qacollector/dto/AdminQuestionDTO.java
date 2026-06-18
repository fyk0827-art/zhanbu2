package com.qacollector.dto;

import lombok.Data;
import java.util.List;

@Data
public class AdminQuestionDTO {
    private Long id;
    private Long ageGroupId;
    private String ageGroupName;
    private Boolean isActive;
    private List<TranslationDTO> translations;
    private List<OptionDTO> options;
}
