package com.qacollector.controller;

import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.ReportPromptsDTO;
import com.qacollector.dto.UpdateReportPromptsRequest;
import com.qacollector.service.ReportPromptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/report-prompts")
@RequiredArgsConstructor
public class ReportPromptController {

    private final ReportPromptService reportPromptService;

    @GetMapping
    public ApiResponse<ReportPromptsDTO> getPrompts() {
        return ApiResponse.ok(reportPromptService.getPrompts());
    }

    @PutMapping
    public ApiResponse<ReportPromptsDTO> updatePrompts(@RequestBody UpdateReportPromptsRequest req) {
        return ApiResponse.ok(reportPromptService.updatePrompts(req));
    }

    @PostMapping("/verify-password")
    public ApiResponse<Boolean> verifyPassword(@RequestBody UpdateReportPromptsRequest req) {
        reportPromptService.verifyPassword(req.getPassword());
        return ApiResponse.ok(true);
    }
}
