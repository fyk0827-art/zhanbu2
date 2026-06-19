package com.lifeblueprint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "meta")
public class MetaProperties {

    private String pixelId = "";
    private String capiAccessToken = "";
    private String testEventCode = "";
    private String productName = "Full Life Blueprint Report";
    private String currency = "USD";

    public String getPixelId() {
        return pixelId;
    }

    public void setPixelId(String pixelId) {
        this.pixelId = pixelId;
    }

    public String getCapiAccessToken() {
        return capiAccessToken;
    }

    public void setCapiAccessToken(String capiAccessToken) {
        this.capiAccessToken = capiAccessToken;
    }

    public String getTestEventCode() {
        return testEventCode;
    }

    public void setTestEventCode(String testEventCode) {
        this.testEventCode = testEventCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isConfigured() {
        return pixelId != null && !pixelId.isBlank()
                && capiAccessToken != null && !capiAccessToken.isBlank();
    }
}
