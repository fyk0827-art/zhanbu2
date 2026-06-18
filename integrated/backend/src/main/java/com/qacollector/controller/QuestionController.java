package com.qacollector.controller;

import com.qacollector.dto.*;
import com.qacollector.service.QuestionService;
import com.qacollector.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuestionController {
    private final QuestionService questionService;
    private final SettingsService settingsService;

    @GetMapping
    public ApiResponse<List<QuestionDTO>> list(
            @RequestParam Long ageGroupId,
            @RequestParam(defaultValue = "en") String language,
            @RequestParam(required = false) Integer limit) {
        int effectiveLimit = settingsService.getQuizQuestionCount();
        return ApiResponse.ok(questionService.getRandomQuestions(ageGroupId, language, effectiveLimit));
    }

    @PostMapping("/answer")
    public ApiResponse<Long> submitAnswer(@RequestBody SubmitAnswerRequest req) {
        return ApiResponse.ok(questionService.submitAnswer(req));
    }
}
