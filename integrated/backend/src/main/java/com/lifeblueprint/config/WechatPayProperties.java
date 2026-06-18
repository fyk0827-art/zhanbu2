package com.lifeblueprint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 微信支付 APIv3 配置，对应 {@code pay.wechat.*}。
 */
@ConfigurationProperties(prefix = "pay.wechat")
public class WechatPayProperties {

    /** 公众号 / 移动应用 AppID，须与商户号绑定 */
    private String appId = "";
    /** 商户号 */
    private String mchId = "";
    /** APIv3 密钥（32 位，商户平台设置） */
    private String apiV3Key = "";
    /** 商户 API 证书序列号 */
    private String merchantSerialNumber = "";
    /** PEM 私钥文件路径（与 merchantPrivateKey 二选一） */
    private String privateKeyPath = "";
    /** PEM 私钥内容（与 privateKeyPath 二选一） */
    private String merchantPrivateKey = "";
    /** 支付结果异步通知，须 HTTPS 公网可达 */
    private String notifyUrl = "";

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getMchId() {
        return mchId;
    }

    public void setMchId(String mchId) {
        this.mchId = mchId;
    }

    public String getApiV3Key() {
        return apiV3Key;
    }

    public void setApiV3Key(String apiV3Key) {
        this.apiV3Key = apiV3Key;
    }

    public String getMerchantSerialNumber() {
        return merchantSerialNumber;
    }

    public void setMerchantSerialNumber(String merchantSerialNumber) {
        this.merchantSerialNumber = merchantSerialNumber;
    }

    public String getPrivateKeyPath() {
        return privateKeyPath;
    }

    public void setPrivateKeyPath(String privateKeyPath) {
        this.privateKeyPath = privateKeyPath;
    }

    public String getMerchantPrivateKey() {
        return merchantPrivateKey;
    }

    public void setMerchantPrivateKey(String merchantPrivateKey) {
        this.merchantPrivateKey = merchantPrivateKey;
    }

    public String getNotifyUrl() {
        return notifyUrl;
    }

    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }

    public boolean hasPrivateKey() {
        return (privateKeyPath != null && !privateKeyPath.isBlank())
                || (merchantPrivateKey != null && !merchantPrivateKey.isBlank());
    }

    public boolean isConfigured() {
        return appId != null && !appId.isBlank()
                && mchId != null && !mchId.isBlank()
                && apiV3Key != null && !apiV3Key.isBlank()
                && merchantSerialNumber != null && !merchantSerialNumber.isBlank()
                && hasPrivateKey();
    }
}
