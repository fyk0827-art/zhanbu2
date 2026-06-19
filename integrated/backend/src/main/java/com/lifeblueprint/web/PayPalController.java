package com.lifeblueprint.web;

import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.service.PayPalService;
import com.lifeblueprint.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/paypal")
public class PayPalController {

    private final PayPalService paypalService;
    private final PaymentService paymentService;
    private final PaymentProperties paymentProps;

    public PayPalController(
            PayPalService paypalService,
            PaymentService paymentService,
            PaymentProperties paymentProps
    ) {
        this.paypalService = paypalService;
        this.paymentService = paymentService;
        this.paymentProps = paymentProps;
    }

    @GetMapping("/pay")
    public RedirectView pay(@RequestParam String orderId) {
        if (paymentProps.isMockMode()) {
            throw new IllegalStateException("当前为 mock 模式，请使用 /api/dev/mock-checkout");
        }
        String approvalUrl = paypalService.createPayPalOrderAndGetApprovalUrl(orderId);
        return new RedirectView(approvalUrl);
    }

    @PostMapping("/confirm-return")
    public Map<String, Object> confirmReturn(@RequestBody Map<String, String> body) {
        if (paymentProps.isMockMode()) {
            throw new IllegalStateException("当前非 PayPal 支付模式");
        }

        String token = body != null ? body.get("token") : null;
        String orderId = body != null ? body.get("orderId") : null;

        if (token != null && !token.isBlank()) {
            Optional<OrderRecord> order = paypalService.captureOrder(token.trim());
            if (order.isPresent()) {
                OrderRecord o = order.get();
                paymentService.reportFacebookPurchase(o);
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("ok", true);
                result.put("orderId", o.id());
                result.put("reportId", o.reportId());
                result.put("status", "paid");
                result.put("unlocked", true);
                return result;
            }
        }

        if (orderId != null && !orderId.isBlank()) {
            Optional<OrderRecord> order = paypalService.queryAndConfirmPaid(orderId.trim());
            if (order.isPresent()) {
                OrderRecord o = order.get();
                paymentService.reportFacebookPurchase(o);
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("ok", true);
                result.put("orderId", o.id());
                result.put("reportId", o.reportId());
                result.put("status", "paid");
                result.put("unlocked", true);
                return result;
            }
        }

        Map<String, Object> pending = new LinkedHashMap<>();
        pending.put("ok", false);
        pending.put("status", "pending");
        if (token != null) pending.put("token", token);
        if (orderId != null) pending.put("orderId", orderId);
        return pending;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> webhook(HttpServletRequest request) throws IOException {
        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        try {
            paypalService.handleWebhook(headers(request), rawBody)
                    .ifPresent(paymentService::reportFacebookPurchase);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    private static Map<String, String> headers(HttpServletRequest request) {
        Map<String, String> headers = new LinkedHashMap<>();
        Enumeration<String> names = request.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            headers.put(name, request.getHeader(name));
        }
        return headers;
    }
}
