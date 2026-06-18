package com.qacollector.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuestionDTO {
    private Long id;
    private Long ageGroupId;
    private String title;
    private String description;
    private Boolean isActive;
    private AgeGroupDTO ageGroup;
    private List<OptionDTO> options;
}
