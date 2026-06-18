package com.lifeblueprint.web;

import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.service.PaymentReturnUrls;
import com.lifeblueprint.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@Controller
@RequestMapping("/api/dev")
public class DevMockController {

    private final PaymentService paymentService;
    private final PaymentProperties props;

    public DevMockController(PaymentService paymentService, PaymentProperties props) {
        this.paymentService = paymentService;
        this.props = props;
    }

    @GetMapping(value = "/mock-checkout", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> mockCheckout(@RequestParam String orderId) {
        if (!props.isMockMode()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Mock checkout disabled");
        }
        return paymentService.orderStatus(orderId)
                .map(payload -> {
                    String title = String.valueOf(payload.get("title"));
                    String yuan = String.valueOf(payload.get("amountYuan"));
                    String html = """
                            <!DOCTYPE html>
                            <html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
                            <title>模拟支付宝收银台</title>
                            <style>
                              body{font-family:system-ui,sans-serif;max-width:400px;margin:40px auto;padding:20px;background:#f5f5f5}
                              .card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
                              h1{font-size:18px;color:#1677ff;margin:0 0 8px}
                              .amt{font-size:32px;font-weight:700;color:#333;margin:16px 0}
                              button{width:100%%;padding:14px;border:none;border-radius:8px;background:#1677ff;color:#fff;font-size:16px;cursor:pointer}
                              p{color:#666;font-size:13px}
                            </style></head><body>
                            <div class="card">
                              <h1>模拟支付宝 · 开发环境</h1>
                              <p>%s</p>
                              <div class="amt">¥ %s</div>
                              <p>订单号：%s</p>
                              <form method="POST" action="/api/dev/mock-pay/%s">
                                <button type="submit">确认支付（模拟）</button>
                              </form>
                            </div>
                            </body></html>
                            """.formatted(title, yuan, orderId, orderId);
                    return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("订单不存在"));
    }

    /** 前端模拟支付：JSON 响应，不跳转收银台页 */
    @PostMapping(value = "/mock-pay/{orderId}/instant", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> mockPayInstant(@PathVariable String orderId) {
        return completeMockPay(orderId);
    }

    /** 模拟收银台 HTML 表单提交 */
    @PostMapping("/mock-pay/{orderId}")
    public Object mockPayForm(@PathVariable String orderId) {
        if (!props.isMockMode()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).contentType(MediaType.TEXT_HTML).body("""
                    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><title>模拟支付已关闭</title></head>
                    <body style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:16px">
                    <h2>当前为真实支付模式</h2>
                    <p>模拟收银台不可用。请回到前端重新点击「支付」。</p>
                    <p>自检：<a href="/api/health">/api/health</a> 中 <code>paymentMode</code> 应为 <code>alipay</code> 或 <code>wechat</code>。</p>
                    </body></html>
                    """);
        }
        OrderRecord order = paymentService.mockPay(orderId)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        String url = PaymentReturnUrls.finalReport(props, order.id(), order.reportId(), true);
        return new RedirectView(url);
    }

    private Map<String, Object> completeMockPay(String orderId) {
        if (!props.isMockMode()) {
            throw new IllegalStateException("当前非模拟支付模式");
        }
        OrderRecord order = paymentService.mockPay(orderId)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在"));
        return Map.of(
                "ok", true,
                "orderId", order.id(),
                "reportId", order.reportId(),
                "unlocked", true
        );
    }
}
