package com.lifeblueprint.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.config.AlipayProperties;
import com.lifeblueprint.config.PayPalProperties;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.config.WechatPayProperties;
import com.lifeblueprint.domain.OrderAttribution;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.domain.OrderStatus;
import com.lifeblueprint.domain.ReportRecord;
import com.lifeblueprint.domain.UnlockRecord;
import com.lifeblueprint.repository.PaymentRepository;
import com.lifeblueprint.web.dto.CreateOrderRequest;
import com.lifeblueprint.web.dto.SaveReportRequest;
import com.qacollector.entity.AgeGroup;
import com.qacollector.repository.AgeGroupRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {

    private final PaymentRepository repo;
    private final PaymentProperties props;
    private final AlipayProperties alipayProps;
    private final WechatPayProperties wechatProps;
    private final AlipayService alipay;
    private final WechatPayService wechat;
    private final PayPalService paypal;
    private final FacebookCapiService facebookCapi;
    private final PayPalProperties paypalProps;
    private final AgeGroupRepository ageGroupRepo;
    private final ObjectMapper objectMapper;

    public PaymentService(
            PaymentRepository repo,
            PaymentProperties props,
            AlipayProperties alipayProps,
            WechatPayProperties wechatProps,
            AlipayService alipay,
            WechatPayService wechat,
            PayPalService paypal,
            PayPalProperties paypalProps,
            FacebookCapiService facebookCapi,
            AgeGroupRepository ageGroupRepo,
            ObjectMapper objectMapper
    ) {
        this.repo = repo;
        this.props = props;
        this.alipayProps = alipayProps;
        this.wechatProps = wechatProps;
        this.alipay = alipay;
        this.wechat = wechat;
        this.paypal = paypal;
        this.paypalProps = paypalProps;
        this.facebookCapi = facebookCapi;
        this.ageGroupRepo = ageGroupRepo;
        this.objectMapper = objectMapper;
    }

    public boolean isDatabaseUp() {
        try {
            return repo.ping();
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, Object> health() {
        boolean dbOk = isDatabaseUp();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", dbOk);
        body.put("paymentMode", props.getMode());
        body.put("alipayConfigured", alipayProps.isConfigured());
        body.put("wechatConfigured", wechatProps.isConfigured());
        body.put("paypalConfigured", paypal.isConfigured());
        if (props.isPaypalMode()) {
            body.put("paypalMode", paypalProps.getMode());
        }
        body.put("database", dbOk ? "connected" : "disconnected");
        body.put("runtime", "spring-boot-java21");
        if (props.isAlipayMode() && !alipayProps.isConfigured()) {
            body.put(
                    "warning",
                    "PAYMENT_MODE=alipay 但未配置密钥，创建订单会失败。请配置 application-local.yml 或改用 mock"
            );
        }
        if (props.isWechatMode() && !wechatProps.isConfigured()) {
            body.put(
                    "warning",
                    "PAYMENT_MODE=wechat 但未配置 pay.wechat.*，创建订单会失败。请配置 application-local.yml 或改用 mock"
            );
        }
        if (props.isPaypalMode() && !paypal.isConfigured()) {
            body.put(
                    "warning",
                    "PAYMENT_MODE=paypal 但未配置 pay.paypal.client-id 或 pay.paypal.secret，创建订单会失败。请配置 application.yml 或改用 mock"
            );
        }
        if (!dbOk) {
            body.put(
                    "warning",
                    "数据库未连接，请启动 MySQL 并执行 src/main/resources/sql/schema.sql"
            );
        }
        if (props.isDisabledMode()) {
            body.put("paymentDisabled", true);
        }
        return body;
    }

    public Map<String, Object> unlockStatus(String reportId) {
        if (props.isDisabledMode()) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("unlocked", true);
            body.put("reportId", reportId);
            body.put("hasReport", repo.findReportById(reportId).isPresent());
            return body;
        }
        Optional<UnlockRecord> unlock = repo.findUnlockByReportId(reportId);
        if (unlock.isEmpty()) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("unlocked", false);
            body.put("reportId", reportId);
            body.put("hasReport", repo.findReportById(reportId).isPresent());
            return body;
        }
        UnlockRecord u = unlock.get();
        Optional<OrderRecord> paidOrder = repo.findOrderById(u.orderId());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("unlocked", true);
        body.put("reportId", reportId);
        body.put("orderId", u.orderId());
        body.put("paidAt", u.paidAt());
        paidOrder.ifPresent(o -> {
            body.put("tradeNo", o.tradeNo());
            body.put("payerContact", o.payerContact());
        });
        return body;
    }

    public void saveReport(String reportId, SaveReportRequest req) {
        String chartJson = null;
        if (req.chartJson() != null) {
            try {
                chartJson = objectMapper.writeValueAsString(req.chartJson());
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("chartJson 格式无效");
            }
        }
        repo.upsertReport(reportId, req.reportText(), chartJson, req.displayName());
    }

    public Optional<Map<String, Object>> getReport(String reportId) {
        Optional<ReportRecord> report = repo.findReportById(reportId);
        if (report.isEmpty()) {
            return Optional.empty();
        }
        ReportRecord r = report.get();
        Optional<UnlockRecord> unlock = repo.findUnlockByReportId(reportId);
        List<OrderRecord> orders = repo.findOrdersByReportId(reportId);
        List<Map<String, Object>> orderPayloads = orders.stream().map(this::orderPayload).toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reportId", reportId);
        body.put("hasReport", true);
        body.put("displayName", r.displayName());

        if (unlock.isEmpty() && !props.isDisabledMode()) {
            body.put("unlocked", false);
            body.put("updatedAt", r.updatedAt());
            body.put("orders", orderPayloads);
            return Optional.of(body);
        }

        body.put("unlocked", true);
        body.put("reportText", r.reportText());
        body.put("chartJson", parseChartJson(r.chartJson()));
        if (unlock.isPresent()) {
            body.put("orderId", unlock.get().orderId());
            body.put("paidAt", unlock.get().paidAt());
        }
        body.put("orders", orderPayloads);
        body.put(
                "paidOrders",
                orders.stream().filter(o -> o.status() == OrderStatus.paid).map(this::orderPayload).toList()
        );
        return Optional.of(body);
    }

    public Map<String, Object> reportOrders(String reportId) {
        Optional<UnlockRecord> unlock = repo.findUnlockByReportId(reportId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reportId", reportId);
        body.put("unlocked", unlock.isPresent() || props.isDisabledMode());
        unlock.ifPresent(u -> body.put("orderId", u.orderId()));
        body.put(
                "orders",
                repo.findOrdersByReportId(reportId).stream().map(this::orderPayload).toList()
        );
        return body;
    }

    public Map<String, Object> createOrder(
            CreateOrderRequest req,
            String userAgent,
            String clientIp,
            String fbp,
            String fbc
    ) {
        String reportId = req.reportId().trim();
        if (props.isDisabledMode()) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("alreadyUnlocked", true);
            body.put("reportId", reportId);
            body.put("paymentMode", "disabled");
            return body;
        }
        Optional<UnlockRecord> existing = repo.findUnlockByReportId(reportId);
        if (existing.isPresent()) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("alreadyUnlocked", true);
            body.put("reportId", reportId);
            body.put("orderId", existing.get().orderId());
            return body;
        }

        String client = req.client() != null ? req.client() : detectClient(userAgent);
        String orderId = PaymentRepository.newOrderId();
        String channel = props.isWechatMode() ? "wechat" : props.isPaypalMode() ? "paypal" : "alipay";
        int amount = resolveOrderAmount();
        String title = props.getProductTitle();
        OrderRecord order = new OrderRecord(
                orderId,
                reportId,
                amount,
                title,
                channel,
                OrderStatus.pending,
                null,
                blankToNull(req.payerContact()),
                blankToNull(req.location()),
                System.currentTimeMillis(),
                null
        );
        repo.upsertOrder(order);
        repo.upsertOrderAttribution(new OrderAttribution(
                orderId,
                blankToNull(clientIp),
                blankToNull(userAgent),
                blankToNull(fbp),
                blankToNull(fbc),
                blankToNull(req.eventSourceUrl()),
                System.currentTimeMillis()
        ));

        PayUrlResult pay = resolvePayUrl(orderId, reportId, client);
        boolean inWeChat = isWeChat(userAgent);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderId", orderId);
        body.put("reportId", reportId);
        body.put("amount", order.amount());
        body.put("amountYuan", String.format("%.2f", order.amount() / 100.0));
        body.put("title", order.title());
        body.put("channel", channel);
        body.put("paymentMode", pay.mode());
        body.put("payUrl", pay.payUrl());
        body.put("wechatInApp", inWeChat);
        if (inWeChat && props.isAlipayMode()) {
            body.put("hint", "微信内无法直接完成支付宝支付，请点击右上角「在浏览器中打开」后重试");
        }
        if (props.isWechatMode()) {
            body.put("hint", "将跳转到微信 H5 收银台；支付完成后可轮询订单状态或调用 /api/wechat/confirm-return");
        }
        return body;
    }

    private int resolveOrderAmount() {
        try {
            List<AgeGroup> groups = ageGroupRepo.findAllByOrderBySortOrderAsc();
            if (!groups.isEmpty()) {
                return groups.get(0).getPrice().multiply(java.math.BigDecimal.valueOf(100)).intValue();
            }
        } catch (Exception ignored) {}
        return props.getOrderAmount();
    }

    private PayUrlResult resolvePayUrl(String orderId, String reportId, String client) {
        if (props.isWechatMode()) {
            return wechat.createPayUrl(orderId);
        }
        if (props.isPaypalMode()) {
            return paypal.createPayUrl(orderId);
        }
        return alipay.createPayUrl(orderId, reportId, client);
    }

    public Optional<Map<String, Object>> orderStatus(String orderId) {
        Optional<OrderRecord> order = repo.findOrderById(orderId);
        if (order.isEmpty()) {
            return Optional.empty();
        }
        OrderRecord o = order.get();
        boolean isPendingReport = "__pending__".equals(o.reportId());
        boolean unlocked = !isPendingReport
            && (repo.findUnlockByReportId(o.reportId()).isPresent() || o.status() == OrderStatus.paid);
        Map<String, Object> body = orderPayload(o);
        body.put("unlocked", unlocked);
        body.put("prepaid", o.status() == OrderStatus.paid && "partner".equals(o.channel()));
        body.put("reportPending", isPendingReport);
        return Optional.of(body);
    }

    public void handleWechatNotify(
            String serial,
            String nonce,
            String signature,
            String timestamp,
            String body
    ) {
        if (props.isMockMode()) {
            return;
        }
        if (!wechatProps.isConfigured()) {
            throw new IllegalArgumentException("微信支付未配置");
        }
        wechat.handleNotify(serial, nonce, signature, timestamp, body)
                .ifPresent(this::reportFacebookPurchase);
    }

    public void handleAlipayNotify(Map<String, String> params) {
        if (!props.isMockMode() && !alipay.verifyNotify(params)) {
            throw new IllegalArgumentException("验签失败");
        }
        String tradeStatus = params.get("trade_status");
        String outTradeNo = params.get("out_trade_no");
        if (("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) && outTradeNo != null) {
            repo.markOrderPaid(outTradeNo, params.get("trade_no"))
                    .ifPresent(this::reportFacebookPurchase);
        }
    }

    public void reportFacebookPurchase(OrderRecord order) {
        facebookCapi.reportPurchase(order);
    }

    /**
     * 支付宝同步回跳确认（本地开发：notify 无法打到 localhost 时由前端带 trade_no 调用）。
     */
    public Map<String, Object> handleAlipaySyncReturn(Map<String, String> params) {
        if (props.isMockMode()) {
            throw new IllegalStateException("当前非支付宝模式");
        }
        if (!alipay.verifyNotify(params)) {
            throw new IllegalArgumentException("支付宝回跳验签失败");
        }
        String outTradeNo = blankToNull(params.get("out_trade_no"));
        String tradeNo = blankToNull(params.get("trade_no"));
        if (outTradeNo == null || tradeNo == null) {
            throw new IllegalArgumentException("缺少 out_trade_no 或 trade_no");
        }
        Optional<OrderRecord> order = repo.markOrderPaid(outTradeNo, tradeNo);
        if (order.isEmpty()) {
            throw new IllegalArgumentException("订单不存在");
        }
        OrderRecord o = order.get();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("orderId", o.id());
        body.put("reportId", o.reportId());
        body.put("status", "paid");
        body.put("unlocked", true);
        return body;
    }

    public static Map<String, String> pickAlipayReturnParams(Map<String, String> body) {
        Map<String, String> params = new LinkedHashMap<>();
        if (body == null) {
            return params;
        }
        body.forEach((k, v) -> {
            if (v != null && !v.isBlank() && !"orderId".equals(k) && !"reportId".equals(k) && !"paid".equals(k)) {
                params.put(k, v.trim());
            }
        });
        if (!params.containsKey("out_trade_no")) {
            String orderId = body.get("orderId");
            if (orderId != null && !orderId.isBlank()) {
                params.put("out_trade_no", orderId.trim());
            }
        }
        return params;
    }

    public Map<String, Object> listOrders(int page, int pageSize) {
        List<OrderRecord> all = repo.findAllOrders();
        int total = all.size();
        int from = Math.min((page - 1) * pageSize, total);
        int to = Math.min(from + pageSize, total);
        List<Map<String, Object>> items = all.subList(from, to).stream().map(this::orderPayload).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        return result;
    }

    public Optional<OrderRecord> mockPay(String orderId) {
        return repo.markOrderPaid(orderId, "MOCK_" + System.currentTimeMillis());
    }

    public Map<String, Object> orderPayload(OrderRecord order) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("orderId", order.id());
        m.put("reportId", order.reportId());
        m.put("status", order.status().name());
        m.put("channel", order.channel());
        m.put("amount", order.amount());
        m.put("amountYuan", String.format("%.2f", order.amount() / 100.0));
        m.put("title", order.title());
        m.put("tradeNo", order.tradeNo());
        m.put("payerContact", order.payerContact());
        m.put("location", order.location());
        m.put("createdAt", order.createdAt());
        m.put("paidAt", order.paidAt());
        return m;
    }

    private JsonNode parseChartJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(raw);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private static String detectClient(String ua) {
        if (ua == null) {
            return "desktop";
        }
        return ua.matches("(?i).*(Mobile|Android|iPhone|iPad).*") ? "mobile" : "desktop";
    }

    private static boolean isWeChat(String ua) {
        return ua != null && ua.contains("MicroMessenger");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
