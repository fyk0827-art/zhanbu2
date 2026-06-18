package com.lifeblueprint.service;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.config.AlipayProperties;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class AlipayService {

    private final PaymentProperties paymentProps;
    private final AlipayProperties alipayProps;
    private final PaymentRepository repo;
    private final ObjectMapper objectMapper;

    public AlipayService(
            PaymentProperties paymentProps,
            AlipayProperties alipayProps,
            PaymentRepository repo,
            ObjectMapper objectMapper
    ) {
        this.paymentProps = paymentProps;
        this.alipayProps = alipayProps;
        this.repo = repo;
        this.objectMapper = objectMapper;
    }

    public PayUrlResult createPayUrl(String orderId, String reportId, String client) {
        if (paymentProps.isMockMode()) {
            String payUrl = paymentProps.getBaseUrl()
                    + "/api/dev/mock-checkout?orderId=" + encode(orderId);
            return new PayUrlResult("mock", payUrl);
        }

        if (!alipayProps.isConfigured()) {
            throw new IllegalArgumentException(
                    "支付宝未配置：请在 application-local.yml 或环境变量中设置 ALIPAY_PRIVATE_KEY、ALIPAY_PUBLIC_KEY，"
                            + "或将 payment.mode 改为 mock"
            );
        }

        String payUrl = paymentProps.getBaseUrl() + "/api/alipay/pay?orderId=" + encode(orderId);
        return new PayUrlResult("alipay", payUrl);
    }

    /**
     * 电脑网站支付：返回支付宝收银台 HTML（由浏览器渲染后自动跳转）。
     */
    public String createPagePayHtml(String orderId) throws AlipayApiException {
        OrderRecord order = repo.findOrderById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在"));

        if (!alipayProps.isConfigured()) {
            throw new IllegalStateException("支付宝未配置");
        }

        AlipayClient client = buildClient();
        AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
        request.setReturnUrl(resolveReturnUrl(order));
        request.setNotifyUrl(resolveNotifyUrl());
        request.setBizContent(buildBizContent(order));

        return client.pageExecute(request).getBody();
    }

    public boolean verifyNotify(Map<String, String> params) {
        if (paymentProps.isMockMode()) {
            return true;
        }
        if (!alipayProps.isConfigured()) {
            return false;
        }
        try {
            return AlipaySignature.rsaCheckV1(
                    params,
                    alipayProps.getAlipayPublicKey(),
                    alipayProps.getCharset(),
                    alipayProps.getSignType()
            );
        } catch (AlipayApiException e) {
            return false;
        }
    }

    private AlipayClient buildClient() {
        return new DefaultAlipayClient(
                alipayProps.getGatewayUrl(),
                alipayProps.getAppId(),
                alipayProps.getMerchantPrivateKey(),
                "json",
                alipayProps.getCharset(),
                alipayProps.getAlipayPublicKey(),
                alipayProps.getSignType()
        );
    }

    private String resolveNotifyUrl() {
        if (alipayProps.getNotifyUrl() != null && !alipayProps.getNotifyUrl().isBlank()) {
            return alipayProps.getNotifyUrl();
        }
        return paymentProps.getBaseUrl() + "/api/alipay/notify";
    }

    private String resolveReturnUrl(OrderRecord order) {
        if (alipayProps.getReturnUrl() != null && !alipayProps.getReturnUrl().isBlank()) {
            return alipayProps.getReturnUrl();
        }
        return PaymentReturnUrls.finalReport(paymentProps, order.id(), order.reportId());
    }

    private String buildBizContent(OrderRecord order) throws AlipayApiException {
        String amountYuan = String.format("%.2f", order.amount() / 100.0);
        Map<String, Object> biz = Map.of(
                "out_trade_no", order.id(),
                "total_amount", amountYuan,
                "subject", order.title(),
                "body", order.reportId(),
                "timeout_express", alipayProps.getTimeout(),
                "product_code", "FAST_INSTANT_TRADE_PAY"
        );
        try {
            return objectMapper.writeValueAsString(biz);
        } catch (JsonProcessingException e) {
            throw new AlipayApiException("构建 biz_content 失败", e);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
