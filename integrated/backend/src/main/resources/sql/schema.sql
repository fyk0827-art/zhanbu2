-- 与 server/sql/schema.sql 相同；请先在 MySQL 中建库后执行本脚本，或由 DBA 维护

CREATE TABLE IF NOT EXISTS reports (
  report_id VARCHAR(32) NOT NULL PRIMARY KEY,
  display_name VARCHAR(64) NULL,
  report_text LONGTEXT NOT NULL,
  chart_json JSON NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_reports_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS unlocks (
  report_id VARCHAR(128) NOT NULL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  paid_at BIGINT NOT NULL,
  INDEX idx_unlocks_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_attribution (
  order_id VARCHAR(64) NOT NULL PRIMARY KEY,
  client_ip VARCHAR(64) NULL,
  user_agent TEXT NULL,
  fbp VARCHAR(255) NULL,
  fbc VARCHAR(255) NULL,
  event_source_url TEXT NULL,
  created_at BIGINT NOT NULL,
  INDEX idx_order_attr_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS facebook_events (
  order_id VARCHAR(64) NOT NULL PRIMARY KEY,
  event_id VARCHAR(128) NOT NULL,
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  response_text TEXT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_facebook_events_status (status),
  INDEX idx_facebook_events_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
