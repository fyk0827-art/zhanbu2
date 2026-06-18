package com.qacollector.service;

import com.qacollector.dto.AdminSettingsDTO;
import com.qacollector.dto.PublicSettingsDTO;
import com.qacollector.dto.UpdateSettingsRequest;
import com.qacollector.entity.AppSetting;
import com.qacollector.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SettingsService {

    public static final String KEY_QUIZ_QUESTION_COUNT = "quiz_question_count";
    public static final String KEY_PAYMENT_MODE = "payment_mode";

    private final AppSettingRepository repository;

    public int getQuizQuestionCount() {
        return parseInt(getValue(KEY_QUIZ_QUESTION_COUNT, "5"), 5, 1, 20);
    }

    public String getPaymentMode() {
        String mode = getValue(KEY_PAYMENT_MODE, "mock");
        return "live".equalsIgnoreCase(mode) ? "live" : "mock";
    }

    public PublicSettingsDTO getPublicSettings() {
        PublicSettingsDTO dto = new PublicSettingsDTO();
        dto.setQuizQuestionCount(getQuizQuestionCount());
        return dto;
    }

    public AdminSettingsDTO getAdminSettings() {
        AdminSettingsDTO dto = new AdminSettingsDTO();
        dto.setQuizQuestionCount(getQuizQuestionCount());
        dto.setPaymentMode(getPaymentMode());
        return dto;
    }

    @Transactional
    public AdminSettingsDTO updateSettings(UpdateSettingsRequest req) {
        if (req.getQuizQuestionCount() != null) {
            int count = parseInt(String.valueOf(req.getQuizQuestionCount()), 5, 1, 20);
            upsert(KEY_QUIZ_QUESTION_COUNT, String.valueOf(count), true,
                "Number of quiz questions shown to users");
        }
        if (req.getPaymentMode() != null) {
            String mode = "live".equalsIgnoreCase(req.getPaymentMode()) ? "live" : "mock";
            upsert(KEY_PAYMENT_MODE, mode, false,
                "Payment mode: mock simulates success; live for future gateway integration");
        }
        return getAdminSettings();
    }

    @Transactional
    public void seedDefaults() {
        if (repository.existsById(KEY_QUIZ_QUESTION_COUNT)) return;
        upsert(KEY_QUIZ_QUESTION_COUNT, "5", true, "Number of quiz questions shown to users");
        upsert(KEY_PAYMENT_MODE, "mock", false, "Payment mode: mock or live");
    }

    private String getValue(String key, String defaultValue) {
        return repository.findById(key)
            .map(AppSetting::getSettingValue)
            .orElse(defaultValue);
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

    private static int parseInt(String raw, int defaultValue, int min, int max) {
        try {
            int value = Integer.parseInt(raw.trim());
            return Math.min(Math.max(value, min), max);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
