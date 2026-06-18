package com.lifeblueprint.web;

import com.alipay.api.AlipayApiException;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.service.AlipayService;
import com.lifeblueprint.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 支付宝沙箱：电脑网站支付页 + 异步通知（须 POST，且 notifyUrl 须公网可达）。
 */
@RestController
@RequestMapping("/api/alipay")
public class AlipayController {

    private final AlipayService alipayService;
    private final PaymentService paymentService;
    private final PaymentProperties paymentProps;

    public AlipayController(
            AlipayService alipayService,
            PaymentService paymentService,
            PaymentProperties paymentProps
    ) {
        this.alipayService = alipayService;
        this.paymentService = paymentService;
        this.paymentProps = paymentProps;
    }

    /**
     * 打开此地址即进入支付宝收银台（返回 HTML，非 JSON）。
     */
    @GetMapping(value = "/pay", produces = MediaType.TEXT_HTML_VALUE)
    public String pay(@RequestParam String orderId) throws AlipayApiException {
        if (paymentProps.isMockMode()) {
            throw new IllegalStateException("当前为 mock 模式，请使用 /api/dev/mock-checkout");
        }
        return alipayService.createPagePayHtml(orderId);
    }

    /**
     * 同步回跳确认：浏览器回跳带 trade_no/sign 时由前端 POST，验签后标记已支付。
     */
    @PostMapping("/confirm-return")
    public Map<String, Object> confirmReturn(@RequestBody Map<String, String> body) {
        return paymentService.handleAlipaySyncReturn(PaymentService.pickAlipayReturnParams(body));
    }

    @PostMapping("/notify")
    public String notify(HttpServletRequest request) {
        Map<String, String> params = new LinkedHashMap<>();
        request.getParameterMap().forEach((name, values) -> {
            if (values != null && values.length > 0) {
                params.put(name, values[0]);
            }
        });

        if (!"TRADE_SUCCESS".equals(params.get("trade_status"))
                && !"TRADE_FINISHED".equals(params.get("trade_status"))) {
            return "success";
        }

        try {
            paymentService.handleAlipayNotify(params);
            return "success";
        } catch (IllegalArgumentException e) {
            return "fail";
        }
    }
}
