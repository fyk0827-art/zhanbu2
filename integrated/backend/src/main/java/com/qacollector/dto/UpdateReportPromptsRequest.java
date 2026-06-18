package com.qacollector.dto;

import lombok.Data;

import java.util.Map;

@Data
public class UpdateReportPromptsRequest {
    private String password;
    private Map<String, String> prompts;
}
