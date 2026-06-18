package com.qacollector.controller;

import com.qacollector.dto.AdminSettingsDTO;
import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.UpdateSettingsRequest;
import com.qacollector.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminSettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ApiResponse<AdminSettingsDTO> getSettings() {
        return ApiResponse.ok(settingsService.getAdminSettings());
    }

    @PutMapping
    public ApiResponse<AdminSettingsDTO> updateSettings(@RequestBody UpdateSettingsRequest req) {
        return ApiResponse.ok(settingsService.updateSettings(req));
    }
}
