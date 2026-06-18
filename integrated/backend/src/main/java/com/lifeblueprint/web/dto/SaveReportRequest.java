package com.lifeblueprint.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SaveReportRequest(
        String reportText,
        JsonNode chartJson,
        String displayName
) {}
