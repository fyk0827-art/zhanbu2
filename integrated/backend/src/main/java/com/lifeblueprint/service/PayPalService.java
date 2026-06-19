package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifeblueprint.config.PayPalProperties;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.repository.PaymentRepository;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@Service
public class PayPalService {

    private final PaymentProperties paymentProps;
    private final PayPalProperties paypalProps;
    private final PaymentRepository repo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PayPalService(
            PaymentProperties paymentProps,
            PayPalProperties paypalProps,
            PaymentRepository repo,
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.paymentProps = paymentProps;
        this.paypalProps = paypalProps;
        this.repo = repo;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public PayUrlResult createPayUrl(String orderId) {
        if (paymentProps.isMockMode()) {
            String payUrl = paymentProps.getBaseUrl()
                    + "/api/dev/mock-checkout?orderId=" + encode(orderId);
            return new PayUrlResult("mock", payUrl);
        }

        if (!paypalProps.isConfigured()) {
            throw new IllegalArgumentException(
                    "PayPal 未配置：请在 application.yml 中设置 pay.paypal.client-id 和 pay.paypal.secret，"
                            + "或将 payment.mode 改为 mock"
            );
        }

        String payUrl = paymentProps.getBaseUrl() + "/api/paypal/pay?orderId=" + encode(orderId);
        return new PayUrlResult("paypal", payUrl);
    }

    /**
     * 创建 PayPal 订单并返回 approval URL（前端重定向到 PayPal 收银台）。
     */
    public String createPayPalOrderAndGetApprovalUrl(String orderId) {
        OrderRecord order = repo.findOrderById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在"));

        if (!paypalProps.isConfigured()) {
            throw new IllegalStateException("PayPal 未配置");
        }

        String accessToken = getAccessToken();
        String returnUrl = resolveReturnUrl(order);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("intent", "CAPTURE");

        ArrayNode purchaseUnits = body.putArray("purchase_units");
        ObjectNode unit = purchaseUnits.addObject();
        unit.put("reference_id", order.id());
        unit.put("custom_id", order.id());
        unit.put("invoice_id", order.id());
        unit.put("description", order.title());

        ObjectNode amount = unit.putObject("amount");
        String amountYuan = String.format("%.2f", order.amount() / 100.0);
        amount.put("currency_code", "USD");
        amount.put("value", amountYuan);

        ObjectNode breakDown = unit.putObject("breakdown");
        ObjectNode itemTotal = breakDown.putObject("item_total");
        itemTotal.put("currency_code", "USD");
        itemTotal.put("value", amountYuan);

        ObjectNode applicationContext = body.putObject("application_context");
        applicationContext.put("brand_name", "PRISM");
        applicationContext.put("landing_page", "NO_PREFERENCE");
        applicationContext.put("user_action", "PAY_NOW");
        applicationContext.put("return_url", returnUrl);
        applicationContext.put("cancel_url", paymentProps.getFrontendUrl() + "/generator?canceled=1");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);

        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(
                    paypalProps.getSandboxBaseUrl() + "/v2/checkout/orders",
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );
        } catch (Exception e) {
            throw new IllegalStateException("PayPal 创建订单失败: " + e.getMessage());
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("PayPal 创建订单失败: HTTP " + response.getStatusCode());
        }

        JsonNode createdOrder = response.getBody();
        String paypalOrderId = createdOrder.get("id").asText();

        // 存储 PayPal order ID 到 trade_no 字段（后续 capture 时使用）
        repo.markOrderPendingWithTradeNo(orderId, paypalOrderId);

        // 从 links 中找出 approval URL
        JsonNode links = createdOrder.get("links");
        if (links != null && links.isArray()) {
            for (JsonNode link : links) {
                if ("approve".equals(link.get("rel").asText())) {
                    return link.get("href").asText();
                }
            }
        }

        throw new IllegalStateException("PayPal 响应中未找到 approval URL");
    }

    /**
     * 捕获 PayPal 订单（用户批准后调用）。
     */
    public Optional<OrderRecord> captureOrder(String paypalOrderId) {
        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>("", headers);

        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(
                    paypalProps.getSandboxBaseUrl() + "/v2/checkout/orders/" + paypalOrderId + "/capture",
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );
        } catch (Exception e) {
            return Optional.empty();
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return Optional.empty();
        }

        JsonNode captureResult = response.getBody();
        JsonNode statusNode = captureResult.get("status");
        if (statusNode == null || !"COMPLETED".equals(statusNode.asText())) {
            return Optional.empty();
        }

        // 从 capture 结果中获取 PayPal 交易 ID
        String captureId = null;
        try {
            JsonNode purchaseUnits = captureResult.get("purchase_units");
            if (purchaseUnits != null && purchaseUnits.isArray() && purchaseUnits.size() > 0) {
                JsonNode payments = purchaseUnits.get(0).get("payments");
                if (payments != null) {
                    JsonNode captures = payments.get("captures");
                    if (captures != null && captures.isArray() && captures.size() > 0) {
                        captureId = captures.get(0).get("id").asText();
                    }
                }
            }
        } catch (Exception e) {
            // ignore parse errors
        }

        // 根据 paypalOrderId 找到内部订单
        Optional<OrderRecord> order = repo.findOrderByTradeNo(paypalOrderId);
        if (order.isEmpty()) {
            return Optional.empty();
        }

        return repo.markOrderPaid(order.get().id(), captureId != null ? captureId : paypalOrderId);
    }

    /**
     * 查询 PayPal 订单状态并确认支付。
     */
    public Optional<OrderRecord> queryAndConfirmPaid(String internalOrderId) {
        Optional<OrderRecord> order = repo.findOrderById(internalOrderId);
        if (order.isEmpty()) {
            return Optional.empty();
        }

        String paypalOrderId = order.get().tradeNo();
        if (paypalOrderId == null || paypalOrderId.isBlank()) {
            return Optional.empty();
        }

        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>("", headers);

        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(
                    paypalProps.getSandboxBaseUrl() + "/v2/checkout/orders/" + paypalOrderId,
                    HttpMethod.GET,
                    request,
                    JsonNode.class
            );
        } catch (Exception e) {
            return Optional.empty();
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return Optional.empty();
        }

        JsonNode orderInfo = response.getBody();
        JsonNode statusNode = orderInfo.get("status");
        if (statusNode == null) {
            return Optional.empty();
        }
        String status = statusNode.asText();
        if (!"APPROVED".equals(status) && !"COMPLETED".equals(status)) {
            return Optional.empty();
        }

        // 如果已 APPROVED 但未 COMPLETED，尝试 capture
        if ("APPROVED".equals(status)) {
            return captureOrder(paypalOrderId);
        }

        // COMPLETED：直接标记已支付
        String captureId = null;
        try {
            JsonNode purchaseUnits = orderInfo.get("purchase_units");
            if (purchaseUnits != null && purchaseUnits.isArray() && purchaseUnits.size() > 0) {
                JsonNode payments = purchaseUnits.get(0).get("payments");
                if (payments != null) {
                    JsonNode captures = payments.get("captures");
                    if (captures != null && captures.isArray() && captures.size() > 0) {
                        captureId = captures.get(0).get("id").asText();
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return repo.markOrderPaid(internalOrderId, captureId != null ? captureId : paypalOrderId);
    }

    public Optional<OrderRecord> handleWebhook(Map<String, String> headers, String rawBody) {
        if (!paypalProps.isConfigured()) {
            throw new IllegalStateException("PayPal 未配置");
        }
        JsonNode event;
        try {
            event = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            throw new IllegalArgumentException("PayPal webhook JSON 无效");
        }
        if (!verifyWebhookSignature(headers, event)) {
            throw new IllegalArgumentException("PayPal webhook 验签失败");
        }

        String eventType = event.path("event_type").asText("");
        if (!"PAYMENT.CAPTURE.COMPLETED".equals(eventType)) {
            return Optional.empty();
        }

        String internalOrderId = event.path("resource")
                .path("supplementary_data")
                .path("related_ids")
                .path("order_id")
                .asText("");
        if (!internalOrderId.isBlank() && !internalOrderId.startsWith("BP")) {
            Optional<OrderRecord> byPaypalOrder = repo.findOrderByTradeNo(internalOrderId);
            if (byPaypalOrder.isPresent()) {
                internalOrderId = byPaypalOrder.get().id();
            }
        }
        if (internalOrderId.isBlank()) {
            internalOrderId = event.path("resource").path("custom_id").asText("");
        }
        if (internalOrderId.isBlank()) {
            internalOrderId = event.path("resource").path("invoice_id").asText("");
        }
        if (internalOrderId.isBlank()) {
            String captureId = event.path("resource").path("id").asText("");
            if (!captureId.isBlank()) {
                Optional<OrderRecord> byTrade = repo.findOrderByTradeNo(captureId);
                if (byTrade.isPresent()) {
                    internalOrderId = byTrade.get().id();
                }
            }
        }
        if (internalOrderId.isBlank()) {
            return Optional.empty();
        }

        String captureId = event.path("resource").path("id").asText(null);
        return repo.markOrderPaid(internalOrderId, captureId);
    }

    private boolean verifyWebhookSignature(Map<String, String> headers, JsonNode event) {
        String webhookId = resolveWebhookId();
        if (webhookId == null || webhookId.isBlank()) {
            throw new IllegalStateException("PayPal webhook ID 未配置");
        }
        ObjectNode body = objectMapper.createObjectNode();
        body.put("auth_algo", header(headers, "PAYPAL-AUTH-ALGO"));
        body.put("cert_url", header(headers, "PAYPAL-CERT-URL"));
        body.put("transmission_id", header(headers, "PAYPAL-TRANSMISSION-ID"));
        body.put("transmission_sig", header(headers, "PAYPAL-TRANSMISSION-SIG"));
        body.put("transmission_time", header(headers, "PAYPAL-TRANSMISSION-TIME"));
        body.put("webhook_id", webhookId);
        body.set("webhook_event", event);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getAccessToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(body.toString(), httpHeaders);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    paypalProps.getSandboxBaseUrl() + "/v1/notifications/verify-webhook-signature",
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );
            return response.getStatusCode().is2xxSuccessful()
                    && response.getBody() != null
                    && "SUCCESS".equals(response.getBody().path("verification_status").asText());
        } catch (Exception e) {
            return false;
        }
    }

    private String resolveWebhookId() {
        String frontend = paymentProps.getFrontendUrl();
        String base = paymentProps.getBaseUrl();
        if ((frontend != null && frontend.contains("dev."))
                || (base != null && base.contains("dev."))) {
            return paypalProps.getWebhookIdDev();
        }
        return paypalProps.getWebhookIdProd();
    }

    private String getAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        String auth = paypalProps.getClientId() + ":" + paypalProps.getSecret();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    paypalProps.getSandboxBaseUrl() + "/v1/oauth2/token",
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("PayPal OAuth2 认证失败");
            }

            return response.getBody().get("access_token").asText();
        } catch (Exception e) {
            throw new IllegalStateException("PayPal OAuth2 认证失败: " + e.getMessage());
        }
    }

    private String resolveReturnUrl(OrderRecord order) {
        if (paypalProps.getReturnUrl() != null && !paypalProps.getReturnUrl().isBlank()) {
            return paypalProps.getReturnUrl();
        }
        return PaymentReturnUrls.finalReport(paymentProps, order.id(), order.reportId());
    }

    public boolean isConfigured() {
        return paypalProps.isConfigured();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String header(Map<String, String> headers, String name) {
        if (headers == null) {
            return "";
        }
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue() == null ? "" : entry.getValue();
            }
        }
        return "";
    }
}
