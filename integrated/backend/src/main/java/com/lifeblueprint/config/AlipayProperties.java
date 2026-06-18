package com.lifeblueprint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 支付宝沙箱/正式环境配置，对应 application.yml 中 {@code pay.alipay.*}。
 * 也可用环境变量覆盖，例如 {@code ALIPAY_APP_ID}。
 */
@ConfigurationProperties(prefix = "pay.alipay")
public class AlipayProperties {

    private String appId = "";
    private String merchantPrivateKey = "";
    private String alipayPublicKey = "";
    private String notifyUrl = "";
    /** 支付完成后浏览器跳转地址；为空时由 AlipayService 按订单动态生成 */
    private String returnUrl = "";
    private String signType = "RSA2";
    private String charset = "utf-8";
    private String gatewayUrl = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";
    /** 订单超时，如 30m、1h */
    private String timeout = "30m";

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getMerchantPrivateKey() {
        return merchantPrivateKey;
    }

    public void setMerchantPrivateKey(String merchantPrivateKey) {
        this.merchantPrivateKey = merchantPrivateKey;
    }

    public String getAlipayPublicKey() {
        return alipayPublicKey;
    }

    public void setAlipayPublicKey(String alipayPublicKey) {
        this.alipayPublicKey = alipayPublicKey;
    }

    public String getNotifyUrl() {
        return notifyUrl;
    }

    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public String getSignType() {
        return signType;
    }

    public void setSignType(String signType) {
        this.signType = signType;
    }

    public String getCharset() {
        return charset;
    }

    public void setCharset(String charset) {
        this.charset = charset;
    }

    public String getGatewayUrl() {
        return gatewayUrl;
    }

    public void setGatewayUrl(String gatewayUrl) {
        this.gatewayUrl = gatewayUrl;
    }

    public String getTimeout() {
        return timeout;
    }

    public void setTimeout(String timeout) {
        this.timeout = timeout;
    }

    public boolean isConfigured() {
        return appId != null && !appId.isBlank()
                && merchantPrivateKey != null && !merchantPrivateKey.isBlank()
                && alipayPublicKey != null && !alipayPublicKey.isBlank()
                && gatewayUrl != null && !gatewayUrl.isBlank();
    }
}
