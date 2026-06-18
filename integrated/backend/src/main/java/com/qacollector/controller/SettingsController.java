package com.qacollector.controller;

import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.PublicSettingsDTO;
import com.qacollector.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/public")
    public ApiResponse<PublicSettingsDTO> getPublicSettings() {
        return ApiResponse.ok(settingsService.getPublicSettings());
    }
}
