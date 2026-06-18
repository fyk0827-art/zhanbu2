package com.qacollector.controller;

import com.qacollector.dto.AnswerDTO;
import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.PageDTO;
import com.qacollector.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/answers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnswerController {
    private final QuestionService questionService;

    @GetMapping
    public ApiResponse<PageDTO<AnswerDTO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(questionService.getAllAnswers(page, pageSize));
    }
}
