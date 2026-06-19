package com.lifeblueprint.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 人生蓝图生成器表结构：reports / orders / unlocks。
 * 若 orders 表为旧版结构（缺 report_id 等列），自动 drop 后重建。
 */
@Slf4j
public final class GeneratorSchemaSupport {

    private GeneratorSchemaSupport() {}

    public static void ensureSchema(JdbcTemplate jdbc) {
        ensureReports(jdbc);
        ensureOrders(jdbc);
        ensureUnlocks(jdbc);
        log.info("Generator schema (reports/orders/unlocks) is ready");
    }

    private static void ensureReports(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS reports (
              report_id VARCHAR(32) NOT NULL PRIMARY KEY,
              display_name VARCHAR(64) NULL,
              report_text LONGTEXT NOT NULL,
              chart_json JSON NULL,
              created_at BIGINT NOT NULL,
              updated_at BIGINT NOT NULL,
              INDEX idx_reports_updated (updated_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
    }

    private static void ensureOrders(JdbcTemplate jdbc) {
        if (tableExists(jdbc, "orders") && !columnExists(jdbc, "orders", "report_id")) {
            log.warn("orders table has outdated schema (missing report_id), migrating...");
            jdbc.execute("DROP TABLE IF EXISTS unlocks");
            if (!tableExists(jdbc, "legacy_app_orders")) {
                jdbc.execute("RENAME TABLE orders TO legacy_app_orders");
            } else {
                jdbc.execute("DROP TABLE IF EXISTS orders");
            }
        }
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS orders (
              id VARCHAR(64) NOT NULL PRIMARY KEY,
              report_id VARCHAR(128) NOT NULL,
              amount INT NOT NULL,
              title VARCHAR(255) NOT NULL,
              channel VARCHAR(32) NOT NULL DEFAULT 'alipay',
              status ENUM('pending', 'paid', 'closed') NOT NULL DEFAULT 'pending',
              trade_no VARCHAR(128) NULL,
              payer_contact VARCHAR(128) NULL,
              created_at BIGINT NOT NULL,
              paid_at BIGINT NULL,
              INDEX idx_orders_report_id (report_id),
              INDEX idx_orders_status (status),
              INDEX idx_orders_trade_no (trade_no),
              INDEX idx_orders_paid_at (paid_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
        ensureColumn(jdbc, "orders", "trade_no",
            "ALTER TABLE orders ADD COLUMN trade_no VARCHAR(128) NULL AFTER status");
        ensureColumn(jdbc, "orders", "payer_contact",
            "ALTER TABLE orders ADD COLUMN payer_contact VARCHAR(128) NULL AFTER trade_no");
        ensureColumn(jdbc, "orders", "paid_at",
            "ALTER TABLE orders ADD COLUMN paid_at BIGINT NULL AFTER created_at");
        ensureColumn(jdbc, "orders", "location",
            "ALTER TABLE orders ADD COLUMN location VARCHAR(255) NULL AFTER payer_contact");
        ensureIndex(jdbc, "orders", "idx_orders_trade_no",
            "CREATE INDEX idx_orders_trade_no ON orders (trade_no)");
    }

    private static void ensureUnlocks(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS unlocks (
              report_id VARCHAR(128) NOT NULL PRIMARY KEY,
              order_id VARCHAR(64) NOT NULL,
              paid_at BIGINT NOT NULL,
              INDEX idx_unlocks_order_id (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
    }

    private static boolean tableExists(JdbcTemplate jdbc, String table) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            """,
            Integer.class,
            table
        );
        return count != null && count > 0;
    }

    private static boolean columnExists(JdbcTemplate jdbc, String table, String column) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
            """,
            Integer.class,
            table,
            column
        );
        return count != null && count > 0;
    }

    private static void ensureColumn(JdbcTemplate jdbc, String table, String column, String ddl) {
        if (!columnExists(jdbc, table, column)) {
            jdbc.execute(ddl);
            log.info("Added missing column {}.{}", table, column);
        }
    }

    private static void ensureIndex(JdbcTemplate jdbc, String table, String indexName, String ddl) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            """,
            Integer.class,
            table,
            indexName
        );
        if (count != null && count == 0) {
            try {
                jdbc.execute(ddl);
            } catch (Exception e) {
                log.debug("Index {} may already exist: {}", indexName, e.getMessage());
            }
        }
    }
}
