package com.qacollector.config;

import com.lifeblueprint.config.GeneratorSchemaSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** 启动时确保 reports/orders/unlocks 表结构正确 */
@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class GeneratorSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        try {
            GeneratorSchemaSupport.ensureSchema(jdbc);
        } catch (Exception e) {
            log.error("Failed to initialize generator schema: {}", e.getMessage(), e);
        }
    }
}
