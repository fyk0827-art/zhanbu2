package com.lifeblueprint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pay.paypal")
public class PayPalProperties {

    private String clientId = "";
    private String secret = "";
    private String sandboxBaseUrl = "https://api-m.sandbox.paypal.com";
    private String returnUrl = "";

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

    public String getSandboxBaseUrl() {
        return sandboxBaseUrl;
    }

    public void setSandboxBaseUrl(String sandboxBaseUrl) {
        this.sandboxBaseUrl = sandboxBaseUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && secret != null && !secret.isBlank();
    }
}
