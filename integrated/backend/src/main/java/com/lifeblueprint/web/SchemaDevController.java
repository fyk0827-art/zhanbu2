package com.lifeblueprint.web;

import com.lifeblueprint.config.GeneratorSchemaSupport;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 开发/运维：手动修复 reports/orders/unlocks 表结构 */
@RestController
@RequestMapping("/api/dev")
public class SchemaDevController {

    private final JdbcTemplate jdbc;

    public SchemaDevController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PostMapping("/ensure-schema")
    public Map<String, Object> ensureSchema() {
        GeneratorSchemaSupport.ensureSchema(jdbc);
        return Map.of("ok", true, "message", "reports/orders/unlocks ready");
    }
}
