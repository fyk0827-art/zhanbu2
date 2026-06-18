package com.qacollector.service;

import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.domain.OrderStatus;
import com.lifeblueprint.repository.PaymentRepository;
import com.qacollector.config.PartnerProperties;
import com.qacollector.dto.PartnerConfirmResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InternalPrepaidService {

    public static final String PENDING_REPORT_ID = "__pending__";

    private final PaymentRepository paymentRepository;
    private final PaymentProperties paymentProperties;
    private final PartnerProperties partnerProperties;

    @Transactional
    public PartnerConfirmResponse confirmPrepaid(String tradeNo, String payerContact) {
        if (tradeNo == null || tradeNo.isBlank()) {
            throw new IllegalArgumentException("tradeNo is required");
        }

        Optional<OrderRecord> existing = paymentRepository.findOrderByTradeNo(tradeNo);
        if (existing.isPresent()) {
            return toResponse(existing.get(), true);
        }

        long now = System.currentTimeMillis();
        String orderId = PaymentRepository.newOrderId();
        int amount = partnerProperties.getStandardAmountCents() > 0
            ? partnerProperties.getStandardAmountCents()
            : paymentProperties.getOrderAmount();

        OrderRecord order = new OrderRecord(
            orderId,
            PENDING_REPORT_ID,
            amount,
            paymentProperties.getProductTitle(),
            "partner",
            OrderStatus.paid,
            tradeNo,
            blankToNull(payerContact),
            null,
            now,
            now
        );
        paymentRepository.upsertOrder(order);
        return toResponse(order, false);
    }

    @Transactional
    public Map<String, Object> bindReport(String orderId, String reportId) {
        if (orderId == null || orderId.isBlank() || reportId == null || reportId.isBlank()) {
            throw new IllegalArgumentException("orderId and reportId are required");
        }

        OrderRecord order = paymentRepository.findOrderById(orderId.trim())
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.status() != OrderStatus.paid) {
            throw new IllegalStateException("Order is not paid");
        }

        String trimmedReportId = reportId.trim();
        paymentRepository.updateOrderReportId(orderId.trim(), trimmedReportId);

        long paidAt = order.paidAt() != null ? order.paidAt() : System.currentTimeMillis();
        paymentRepository.upsertUnlock(trimmedReportId, orderId.trim(), paidAt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("orderId", orderId.trim());
        body.put("reportId", trimmedReportId);
        body.put("unlocked", true);
        return body;
    }

    public Optional<Map<String, Object>> orderInfo(String orderId) {
        return paymentRepository.findOrderById(orderId).map(order -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("orderId", order.id());
            body.put("reportId", order.reportId());
            body.put("status", order.status().name());
            body.put("prepaid", order.status() == OrderStatus.paid);
            body.put("reportPending", PENDING_REPORT_ID.equals(order.reportId()));
            body.put("amount", order.amount());
            body.put("amountYuan", String.format("%.2f", order.amount() / 100.0));
            body.put("title", order.title());
            body.put("tradeNo", order.tradeNo());
            body.put("paidAt", order.paidAt());
            if (!PENDING_REPORT_ID.equals(order.reportId())) {
                body.put("unlocked", paymentRepository.findUnlockByReportId(order.reportId()).isPresent());
            }
            return body;
        });
    }

    private PartnerConfirmResponse toResponse(OrderRecord order, boolean alreadyConfirmed) {
        PartnerConfirmResponse res = new PartnerConfirmResponse();
        res.setOk(true);
        res.setAlreadyConfirmed(alreadyConfirmed);
        res.setOrderId(order.id());
        res.setPrepaid(true);
        res.setReportPending(PENDING_REPORT_ID.equals(order.reportId()));
        res.setFrontendUrl(buildGeneratorUrl(order.id()));
        res.setAmount(order.amount());
        res.setAmountDisplay(String.format("%.2f", order.amount() / 100.0));
        res.setTradeNo(order.tradeNo());
        res.setHint("请引导用户打开 frontendUrl，在前端填写信息并生成报告");
        return res;
    }

    private String buildGeneratorUrl(String orderId) {
        String base = paymentProperties.getFrontendUrl();
        String path = partnerProperties.getGeneratorPath();
        if (path == null || path.isBlank()) {
            path = "/generator";
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return base + path + "?orderId=" + orderId;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
