package com.lifeblueprint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pay.paypal")
public class PayPalProperties {

    private String clientId = "";
    private String secret = "";
    private String mode = "sandbox";
    private String sandboxBaseUrl = "https://api-m.sandbox.paypal.com";
    private String liveBaseUrl = "https://api-m.paypal.com";
    private String returnUrl = "";
    private String webhookIdDev = "";
    private String webhookIdProd = "";

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getSandboxBaseUrl() {
        return sandboxBaseUrl;
    }

    public void setSandboxBaseUrl(String sandboxBaseUrl) {
        this.sandboxBaseUrl = sandboxBaseUrl;
    }

    public String getLiveBaseUrl() {
        return liveBaseUrl;
    }

    public void setLiveBaseUrl(String liveBaseUrl) {
        this.liveBaseUrl = liveBaseUrl;
    }

    public String getBaseUrl() {
        return isLiveMode() ? liveBaseUrl : sandboxBaseUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public String getWebhookIdDev() {
        return webhookIdDev;
    }

    public void setWebhookIdDev(String webhookIdDev) {
        this.webhookIdDev = webhookIdDev;
    }

    public String getWebhookIdProd() {
        return webhookIdProd;
    }

    public void setWebhookIdProd(String webhookIdProd) {
        this.webhookIdProd = webhookIdProd;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && secret != null && !secret.isBlank();
    }

    public boolean isLiveMode() {
        return "live".equalsIgnoreCase(mode) || "prod".equalsIgnoreCase(mode) || "production".equalsIgnoreCase(mode);
    }
}
