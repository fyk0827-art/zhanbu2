package com.lifeblueprint.repository;

import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.domain.OrderStatus;
import com.lifeblueprint.domain.ReportRecord;
import com.lifeblueprint.domain.UnlockRecord;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PaymentRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<OrderRecord> ORDER_MAPPER = (rs, rowNum) -> {
        try {
            return new OrderRecord(
                rs.getString("id"),
                rs.getString("report_id"),
                rs.getInt("amount"),
                rs.getString("title"),
                rs.getString("channel"),
                OrderStatus.valueOf(rs.getString("status")),
                rs.getString("trade_no"),
                rs.getString("payer_contact"),
                rs.getString("location"),
                rs.getLong("created_at"),
                rs.getObject("paid_at") != null ? rs.getLong("paid_at") : null
            );
        } catch (java.sql.SQLException e) {
            throw new RuntimeException(e);
        }
    };

    public PaymentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<OrderRecord> findOrderByTradeNo(String tradeNo) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    """
                    SELECT id, report_id, amount, title, channel, status, trade_no, payer_contact, location, created_at, paid_at
                    FROM orders WHERE trade_no = ? LIMIT 1
                    """,
                    ORDER_MAPPER,
                    tradeNo
            ));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void updateOrderReportId(String orderId, String reportId) {
        jdbc.update("UPDATE orders SET report_id = ? WHERE id = ?", reportId, orderId);
    }

    public void upsertUnlock(String reportId, String orderId, long paidAt) {
        jdbc.update(
                """
                INSERT INTO unlocks (report_id, order_id, paid_at) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE order_id = VALUES(order_id), paid_at = VALUES(paid_at)
                """,
                reportId,
                orderId,
                paidAt
        );
    }

    public Optional<OrderRecord> findOrderById(String id) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    """
                    SELECT id, report_id, amount, title, channel, status, trade_no, payer_contact, location, created_at, paid_at
                    FROM orders WHERE id = ? LIMIT 1
                    """,
                    ORDER_MAPPER,
                    id
            ));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<OrderRecord> findOrdersByReportId(String reportId) {
        return jdbc.query(
                """
                SELECT id, report_id, amount, title, channel, status, trade_no, payer_contact, location, created_at, paid_at
                FROM orders WHERE report_id = ? ORDER BY created_at DESC
                """,
                ORDER_MAPPER,
                reportId
        );
    }

    public void upsertOrder(OrderRecord order) {
        jdbc.update(
                """
                INSERT INTO orders (id, report_id, amount, title, channel, status, trade_no, payer_contact, location, created_at, paid_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  report_id = VALUES(report_id),
                  amount = VALUES(amount),
                  title = VALUES(title),
                  channel = VALUES(channel),
                  status = VALUES(status),
                  trade_no = VALUES(trade_no),
                  payer_contact = COALESCE(VALUES(payer_contact), payer_contact),
                  location = VALUES(location),
                  paid_at = VALUES(paid_at)
                """,
                order.id(),
                order.reportId(),
                order.amount(),
                order.title(),
                order.channel(),
                order.status().name(),
                order.tradeNo(),
                order.payerContact(),
                order.location(),
                order.createdAt(),
                order.paidAt()
        );
    }

    public Optional<UnlockRecord> findUnlockByReportId(String reportId) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    "SELECT report_id, order_id, paid_at FROM unlocks WHERE report_id = ? LIMIT 1",
                    (rs, rowNum) -> new UnlockRecord(
                            rs.getString("report_id"),
                            rs.getString("order_id"),
                            rs.getLong("paid_at")
                    ),
                    reportId
            ));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Transactional
    public Optional<OrderRecord> markOrderPaid(String orderId, String tradeNo) {
        Optional<OrderRecord> existing = findOrderById(orderId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        OrderRecord row = existing.get();
        long paidAt = System.currentTimeMillis();
        if (row.status() != OrderStatus.paid) {
            jdbc.update(
                    "UPDATE orders SET status = 'paid', paid_at = ?, trade_no = COALESCE(?, trade_no) WHERE id = ?",
                    paidAt,
                    tradeNo,
                    orderId
            );
            jdbc.update(
                    """
                    INSERT INTO unlocks (report_id, order_id, paid_at) VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE order_id = VALUES(order_id), paid_at = VALUES(paid_at)
                    """,
                    row.reportId(),
                    orderId,
                    paidAt
            );
        }
        return findOrderById(orderId);
    }

    public void upsertReport(String reportId, String reportText, String chartJson, String displayName) {
        long now = System.currentTimeMillis();
        jdbc.update(
                """
                INSERT INTO reports (report_id, display_name, report_text, chart_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  display_name = COALESCE(VALUES(display_name), display_name),
                  report_text = VALUES(report_text),
                  chart_json = COALESCE(VALUES(chart_json), chart_json),
                  updated_at = VALUES(updated_at)
                """,
                reportId,
                displayName,
                reportText,
                chartJson,
                now,
                now
        );
    }

    public Optional<ReportRecord> findReportById(String reportId) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    """
                    SELECT report_id, display_name, report_text, chart_json, created_at, updated_at
                    FROM reports WHERE report_id = ? LIMIT 1
                    """,
                    (rs, rowNum) -> new ReportRecord(
                            rs.getString("report_id"),
                            rs.getString("display_name"),
                            rs.getString("report_text"),
                            rs.getString("chart_json"),
                            rs.getLong("created_at"),
                            rs.getLong("updated_at")
                    ),
                    reportId
            ));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void markOrderPendingWithTradeNo(String orderId, String tradeNo) {
        jdbc.update(
                "UPDATE orders SET trade_no = ? WHERE id = ? AND (trade_no IS NULL OR trade_no = '')",
                tradeNo,
                orderId
        );
    }

    public List<OrderRecord> findAllOrders() {
        return jdbc.query(
                "SELECT id, report_id, amount, title, channel, status, trade_no, payer_contact, location, created_at, paid_at FROM orders ORDER BY created_at DESC",
                ORDER_MAPPER
        );
    }

    public boolean ping() {
        jdbc.queryForObject("SELECT 1", Integer.class);
        return true;
    }

    public static String newOrderId() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "BP" + System.currentTimeMillis() + suffix;
    }
}
