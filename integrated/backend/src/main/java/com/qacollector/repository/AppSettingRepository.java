package com.qacollector.repository;

import com.qacollector.entity.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {
    List<AppSetting> findByPublicVisibleTrue();
}
