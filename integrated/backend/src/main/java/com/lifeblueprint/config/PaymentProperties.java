package com.lifeblueprint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "payment")
public class PaymentProperties {

    private String mode = "mock";
    private int orderAmount = 2990;
    private String productTitle = "人生蓝图·完整行动版";
    private String frontendUrl = "http://localhost:3030";
    private String baseUrl = "http://localhost:8880";
    private Alipay alipay = new Alipay();

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public int getOrderAmount() {
        return orderAmount;
    }

    public void setOrderAmount(int orderAmount) {
        this.orderAmount = orderAmount;
    }

    public String getProductTitle() {
        return productTitle;
    }

    public void setProductTitle(String productTitle) {
        this.productTitle = productTitle;
    }

    public String getFrontendUrl() {
        return stripTrailingSlash(frontendUrl);
    }

    public void setFrontendUrl(String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    public String getBaseUrl() {
        return stripTrailingSlash(baseUrl);
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public Alipay getAlipay() {
        return alipay;
    }

    public void setAlipay(Alipay alipay) {
        this.alipay = alipay;
    }

    public boolean isDisabledMode() {
        return mode != null && "disabled".equalsIgnoreCase(mode);
    }

    public boolean isMockMode() {
        if (isDisabledMode()) {
            return false;
        }
        if (mode == null || mode.isBlank()) {
            return true;
        }
        return "mock".equalsIgnoreCase(mode);
    }

    public boolean isAlipayMode() {
        return "alipay".equalsIgnoreCase(mode);
    }

    public boolean isWechatMode() {
        return "wechat".equalsIgnoreCase(mode);
    }

    public boolean isPaypalMode() {
        return "paypal".equalsIgnoreCase(mode);
    }

    private static String stripTrailingSlash(String url) {
        if (url == null || url.isEmpty()) {
            return url;
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    public static class Alipay {
        private String appId = "";
        private String privateKey = "";
        private String publicKey = "";
        private String gateway = "https://openapi.alipay.com/gateway.do";

        public String getAppId() {
            return appId;
        }

        public void setAppId(String appId) {
            this.appId = appId;
        }

        public String getPrivateKey() {
            return privateKey;
        }

        public void setPrivateKey(String privateKey) {
            this.privateKey = privateKey;
        }

        public String getPublicKey() {
            return publicKey;
        }

        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }

        public String getGateway() {
            return gateway;
        }

        public void setGateway(String gateway) {
            this.gateway = gateway;
        }

        public boolean isConfigured() {
            return appId != null && !appId.isBlank()
                    && privateKey != null && !privateKey.isBlank()
                    && publicKey != null && !publicKey.isBlank();
        }
    }
}
