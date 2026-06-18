package com.lifeblueprint.web;

import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.service.PaymentService;
import com.lifeblueprint.web.dto.CreateOrderRequest;
import com.lifeblueprint.web.dto.SaveReportRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class PaymentApiController {

    private final PaymentService paymentService;
    private final PaymentProperties props;

    public PaymentApiController(PaymentService paymentService, PaymentProperties props) {
        this.paymentService = paymentService;
        this.props = props;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return paymentService.health();
    }

    @GetMapping("/unlock/{reportId}")
    public Map<String, Object> unlock(@PathVariable String reportId) {
        return paymentService.unlockStatus(reportId);
    }

    @PutMapping("/reports/{reportId}")
    public Map<String, Object> saveReport(
            @PathVariable String reportId,
            @RequestBody SaveReportRequest body
    ) {
        if (!StringUtils.hasText(reportId) || body.reportText() == null || body.reportText().isBlank()) {
            throw new IllegalArgumentException("reportId 与 reportText 必填");
        }
        paymentService.saveReport(reportId.trim(), body);
        return Map.of("ok", true, "reportId", reportId.trim());
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<Map<String, Object>> getReport(@PathVariable String reportId) {
        Optional<Map<String, Object>> body = paymentService.getReport(reportId);
        if (body.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "reportId", reportId,
                    "hasReport", false,
                    "unlocked", false
            ));
        }
        return ResponseEntity.ok(body.get());
    }

    @GetMapping("/reports/{reportId}/orders")
    public Map<String, Object> reportOrders(@PathVariable String reportId) {
        return paymentService.reportOrders(reportId);
    }

    @PostMapping("/orders")
    public Map<String, Object> createOrder(
            @RequestBody(required = false) CreateOrderRequest body,
            @RequestHeader(value = "User-Agent", defaultValue = "") String userAgent
    ) {
        if (body == null || !StringUtils.hasText(body.reportId())) {
            throw new IllegalArgumentException("reportId 必填");
        }
        return paymentService.createOrder(body, userAgent);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> orderStatus(@PathVariable String orderId) {
        Optional<Map<String, Object>> body = paymentService.orderStatus(orderId);
        return body.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "订单不存在")));
    }

    @PostMapping(value = "/notify/alipay", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public String alipayNotify(HttpServletRequest request, @RequestBody(required = false) Map<String, String> jsonBody) {
        Map<String, String> params = new LinkedHashMap<>();
        String contentType = request.getContentType() != null ? request.getContentType() : "";
        if (contentType.contains("application/json") && jsonBody != null) {
            params.putAll(jsonBody);
        } else {
            request.getParameterMap().forEach((k, v) -> {
                if (v != null && v.length > 0) {
                    params.put(k, v[0]);
                }
            });
        }
        try {
            paymentService.handleAlipayNotify(params);
            return "success";
        } catch (IllegalArgumentException e) {
            return "fail";
        }
    }
}
