package com.qacollector.service;

import com.qacollector.dto.ReportPromptsDTO;
import com.qacollector.dto.UpdateReportPromptsRequest;
import com.qacollector.entity.AppSetting;
import com.qacollector.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReportPromptService {

    public static final String KEY_SETTINGS_PASSWORD = "generator_settings_password";
    public static final String KEY_PROMPT_PREFIX = "report_system_prompt_";
    public static final String DEFAULT_PASSWORD = "284657";

    private static final Set<String> ALLOWED_TYPES = Set.of("full", "simple", "marriage", "career");
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final AppSettingRepository repository;

    public ReportPromptsDTO getPrompts() {
        ReportPromptsDTO dto = new ReportPromptsDTO();
        Map<String, String> prompts = new LinkedHashMap<>();
        Map<String, String> updatedAt = new LinkedHashMap<>();
        for (String type : List.of("full", "simple", "marriage", "career")) {
            repository.findById(promptKey(type)).ifPresent(s -> {
                prompts.put(type, s.getSettingValue());
                if (s.getUpdatedAt() != null) {
                    updatedAt.put(type, s.getUpdatedAt().format(ISO));
                }
            });
        }
        dto.setPrompts(prompts);
        dto.setUpdatedAt(updatedAt);
        return dto;
    }

    @Transactional
    public ReportPromptsDTO updatePrompts(UpdateReportPromptsRequest req) {
        verifyPassword(req.getPassword());
        if (req.getPrompts() == null || req.getPrompts().isEmpty()) {
            throw new IllegalArgumentException("prompts is required");
        }
        for (Map.Entry<String, String> entry : req.getPrompts().entrySet()) {
            String type = entry.getKey();
            if (!ALLOWED_TYPES.contains(type)) {
                throw new IllegalArgumentException("Unsupported report type: " + type);
            }
            String value = entry.getValue();
            if (value == null || value.isBlank()) {
                repository.deleteById(promptKey(type));
                continue;
            }
            upsert(promptKey(type), value.trim(), false,
                "System prompt for report type: " + type);
        }
        return getPrompts();
    }

    public void verifyPassword(String password) {
        String expected = repository.findById(KEY_SETTINGS_PASSWORD)
            .map(AppSetting::getSettingValue)
            .orElse(DEFAULT_PASSWORD);
        if (password == null || !expected.equals(password.trim())) {
            throw new IllegalArgumentException("密码错误");
        }
    }

    @Transactional
    public void seedDefaults() {
        if (!repository.existsById(KEY_SETTINGS_PASSWORD)) {
            upsert(KEY_SETTINGS_PASSWORD, DEFAULT_PASSWORD, false,
                "Generator settings page password");
        }
    }

    private static String promptKey(String reportType) {
        return KEY_PROMPT_PREFIX + reportType;
    }

    private void upsert(String key, String value, boolean publicVisible, String description) {
        AppSetting setting = repository.findById(key).orElseGet(AppSetting::new);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        setting.setPublicVisible(publicVisible);
        setting.setDescription(description);
        setting.setUpdatedAt(LocalDateTime.now());
        repository.save(setting);
    }
}
