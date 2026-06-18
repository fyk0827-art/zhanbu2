package com.qacollector.dto;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class ReportPromptsDTO {
    private Map<String, String> prompts = new LinkedHashMap<>();
    private Map<String, String> updatedAt = new LinkedHashMap<>();
}
