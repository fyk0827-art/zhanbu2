package com.qacollector.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "partner")
public class PartnerProperties {
    /** local = 跳转本地生成器；remote = 调用外部报告平台 API */
    private String mode = "local";
    /** 本地生成器前端路径，如 /generator */
    private String generatorPath = "/generator";
    /** e.g. http://39.97.224.240:8848 (仅 remote 模式) */
    private String apiBaseUrl = "http://39.97.224.240:8848";
    private String webhookSecret = "";
    /** 预付费金额（分），默认与生成器 order-amount 一致 */
    private int standardAmountCents = 2990;
}
