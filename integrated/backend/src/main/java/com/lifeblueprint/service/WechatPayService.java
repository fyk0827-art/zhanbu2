package com.lifeblueprint.service;

import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.config.WechatPayProperties;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.repository.PaymentRepository;
import com.wechat.pay.java.core.RSAAutoCertificateConfig;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.core.notification.RequestParam;
import com.wechat.pay.java.core.util.PemUtil;
import com.wechat.pay.java.service.payments.h5.H5Service;
import com.wechat.pay.java.service.payments.h5.model.Amount;
import com.wechat.pay.java.service.payments.h5.model.H5Info;
import com.wechat.pay.java.service.payments.h5.model.PrepayRequest;
import com.wechat.pay.java.service.payments.h5.model.PrepayResponse;
import com.wechat.pay.java.service.payments.h5.model.SceneInfo;
import com.wechat.pay.java.service.payments.model.Transaction;
import com.wechat.pay.java.service.payments.h5.model.QueryOrderByOutTradeNoRequest;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.util.Optional;

@Service
public class WechatPayService {

    private final PaymentProperties paymentProps;
    private final WechatPayProperties wechatProps;
    private final PaymentRepository repo;

    private volatile RSAAutoCertificateConfig wxConfig;
    private volatile H5Service h5Service;
    private volatile NotificationParser notificationParser;

    public WechatPayService(
            PaymentProperties paymentProps,
            WechatPayProperties wechatProps,
            PaymentRepository repo
    ) {
        this.paymentProps = paymentProps;
        this.wechatProps = wechatProps;
        this.repo = repo;
    }

    public PayUrlResult createPayUrl(String orderId) {
        if (paymentProps.isMockMode()) {
            String payUrl = paymentProps.getBaseUrl()
                    + "/api/dev/mock-checkout?orderId=" + encode(orderId);
            return new PayUrlResult("mock", payUrl);
        }

        if (!wechatProps.isConfigured()) {
            throw new IllegalArgumentException(
                    "微信支付未配置：请在 application-local.yml 中设置 pay.wechat.*，"
                            + "或将 payment.mode 改为 mock"
            );
        }

        String payUrl = paymentProps.getBaseUrl() + "/api/wechat/pay?orderId=" + encode(orderId);
        return new PayUrlResult("wechat", payUrl);
    }

    /**
     * H5 下单并返回带 redirect_url 的收银台地址。
     */
    public String createH5PayUrl(String orderId, String clientIp) {
        OrderRecord order = repo.findOrderById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在"));

        if (!wechatProps.isConfigured()) {
            throw new IllegalStateException("微信支付未配置");
        }

        PrepayRequest request = new PrepayRequest();
        request.setAppid(wechatProps.getAppId());
        request.setMchid(wechatProps.getMchId());
        request.setDescription(order.title());
        request.setOutTradeNo(order.id());
        request.setNotifyUrl(resolveNotifyUrl());

        Amount amount = new Amount();
        amount.setTotal(order.amount());
        amount.setCurrency("CNY");
        request.setAmount(amount);

        SceneInfo sceneInfo = new SceneInfo();
        sceneInfo.setPayerClientIp(blankToDefault(clientIp, "127.0.0.1"));
        H5Info h5Info = new H5Info();
        h5Info.setType("Wap");
        sceneInfo.setH5Info(h5Info);
        request.setSceneInfo(sceneInfo);

        PrepayResponse response = h5Service().prepay(request);
        String h5Url = response.getH5Url();
        if (h5Url == null || h5Url.isBlank()) {
            throw new IllegalStateException("微信 H5 下单未返回 h5_url");
        }

        String returnUrl = PaymentReturnUrls.finalReport(paymentProps, order.id(), order.reportId());
        String separator = h5Url.contains("?") ? "&" : "?";
        return h5Url + separator + "redirect_url=" + encode(returnUrl);
    }

    public Optional<OrderRecord> queryAndConfirmPaid(String orderId) {
        if (!wechatProps.isConfigured()) {
            throw new IllegalStateException("微信支付未配置");
        }

        QueryOrderByOutTradeNoRequest request = new QueryOrderByOutTradeNoRequest();
        request.setMchid(wechatProps.getMchId());
        request.setOutTradeNo(orderId);

        Transaction transaction = h5Service().queryOrderByOutTradeNo(request);
        if (transaction == null || !"SUCCESS".equals(transaction.getTradeState())) {
            return Optional.empty();
        }
        return repo.markOrderPaid(orderId, transaction.getTransactionId());
    }

    public Optional<OrderRecord> handleNotify(
            String serial,
            String nonce,
            String signature,
            String timestamp,
            String body
    ) {
        RequestParam requestParam = new RequestParam.Builder()
                .serialNumber(serial)
                .nonce(nonce)
                .signature(signature)
                .timestamp(timestamp)
                .body(body)
                .build();

        Transaction transaction = notificationParser().parse(requestParam, Transaction.class);
        if (transaction == null || !"SUCCESS".equals(transaction.getTradeState())) {
            return Optional.empty();
        }

        String outTradeNo = transaction.getOutTradeNo();
        if (outTradeNo == null || outTradeNo.isBlank()) {
            return Optional.empty();
        }
        return repo.markOrderPaid(outTradeNo, transaction.getTransactionId());
    }

    private H5Service h5Service() {
        if (h5Service == null) {
            synchronized (this) {
                if (h5Service == null) {
                    h5Service = new H5Service.Builder().config(wxConfig()).build();
                }
            }
        }
        return h5Service;
    }

    private NotificationParser notificationParser() {
        if (notificationParser == null) {
            synchronized (this) {
                if (notificationParser == null) {
                    notificationParser = new NotificationParser(wxConfig());
                }
            }
        }
        return notificationParser;
    }

    private RSAAutoCertificateConfig wxConfig() {
        if (wxConfig == null) {
            synchronized (this) {
                if (wxConfig == null) {
                    wxConfig = buildConfig();
                }
            }
        }
        return wxConfig;
    }

    private RSAAutoCertificateConfig buildConfig() {
        RSAAutoCertificateConfig.Builder builder = new RSAAutoCertificateConfig.Builder()
                .merchantId(wechatProps.getMchId())
                .merchantSerialNumber(wechatProps.getMerchantSerialNumber())
                .apiV3Key(wechatProps.getApiV3Key());

        if (wechatProps.getPrivateKeyPath() != null && !wechatProps.getPrivateKeyPath().isBlank()) {
            builder.privateKeyFromPath(wechatProps.getPrivateKeyPath().trim());
        } else {
            PrivateKey privateKey = PemUtil.loadPrivateKeyFromString(
                    normalizePrivateKey(wechatProps.getMerchantPrivateKey())
            );
            builder.privateKey(privateKey);
        }

        return builder.build();
    }

    private String resolveNotifyUrl() {
        if (wechatProps.getNotifyUrl() != null && !wechatProps.getNotifyUrl().isBlank()) {
            return wechatProps.getNotifyUrl();
        }
        return paymentProps.getBaseUrl() + "/api/wechat/notify";
    }

    private static String normalizePrivateKey(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.contains("BEGIN")) {
            return trimmed;
        }
        return "-----BEGIN PRIVATE KEY-----\n" + trimmed + "\n-----END PRIVATE KEY-----";
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
