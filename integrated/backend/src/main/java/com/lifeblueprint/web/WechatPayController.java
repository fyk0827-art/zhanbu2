package com.lifeblueprint.web;

import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.service.PaymentService;
import com.lifeblueprint.service.WechatPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 微信 H5 支付：跳转收银台 + 异步通知 + 回跳后查单确认。
 */
@RestController
@RequestMapping("/api/wechat")
public class WechatPayController {

    private final WechatPayService wechatPayService;
    private final PaymentService paymentService;
    private final PaymentProperties paymentProps;

    public WechatPayController(
            WechatPayService wechatPayService,
            PaymentService paymentService,
            PaymentProperties paymentProps
    ) {
        this.wechatPayService = wechatPayService;
        this.paymentService = paymentService;
        this.paymentProps = paymentProps;
    }

    /**
     * 浏览器打开此地址后 302 跳转到微信 H5 收银台。
     */
    @GetMapping("/pay")
    public RedirectView pay(
            @RequestParam String orderId,
            HttpServletRequest request
    ) {
        if (paymentProps.isMockMode()) {
            throw new IllegalStateException("当前为 mock 模式，请使用 /api/dev/mock-checkout");
        }
        String h5Url = wechatPayService.createH5PayUrl(orderId, resolveClientIp(request));
        return new RedirectView(h5Url);
    }

    /**
     * 支付完成后前端回跳页可调用，主动查单（notify 未达时兜底）。
     */
    @PostMapping("/confirm-return")
    public Map<String, Object> confirmReturn(@RequestBody Map<String, String> body) {
        if (paymentProps.isMockMode()) {
            throw new IllegalStateException("当前非微信支付模式");
        }
        String orderId = body != null ? body.get("orderId") : null;
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("orderId 必填");
        }

        Optional<OrderRecord> order = wechatPayService.queryAndConfirmPaid(orderId.trim());
        if (order.isEmpty()) {
            Map<String, Object> pending = new LinkedHashMap<>();
            pending.put("ok", false);
            pending.put("status", "pending");
            pending.put("orderId", orderId.trim());
            return pending;
        }

        OrderRecord o = order.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", true);
        result.put("orderId", o.id());
        result.put("reportId", o.reportId());
        result.put("status", "paid");
        result.put("unlocked", true);
        return result;
    }

    @PostMapping("/notify")
    public Map<String, String> notify(HttpServletRequest request) throws IOException {
        String body = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String serial = request.getHeader("Wechatpay-Serial");
        String nonce = request.getHeader("Wechatpay-Nonce");
        String signature = request.getHeader("Wechatpay-Signature");
        String timestamp = request.getHeader("Wechatpay-Timestamp");

        try {
            paymentService.handleWechatNotify(serial, nonce, signature, timestamp, body);
            return Map.of("code", "SUCCESS", "message", "成功");
        } catch (IllegalArgumentException e) {
            return Map.of("code", "FAIL", "message", "验签或处理失败");
        }
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return comma > 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
