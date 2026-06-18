package com.lifeblueprint.domain;

public record ReportRecord(
        String reportId,
        String displayName,
        String reportText,
        String chartJson,
        long createdAt,
        long updatedAt
) {}
