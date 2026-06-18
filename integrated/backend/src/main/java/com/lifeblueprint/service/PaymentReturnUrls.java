package com.lifeblueprint.service;

import com.lifeblueprint.config.PaymentProperties;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 支付完成后的前端同步回跳地址（支付宝 return_url / Mock 重定向）。
 * <p>
 * 目标：{@code {FRONTEND_URL}/#/final-report?orderId=...&reportId=...}
 * <p>
 * 前端使用 HashRouter，同步回跳必须带 {@code /#/}，否则只会打开站点根路径（首页表单）。
 */
public final class PaymentReturnUrls {

    private PaymentReturnUrls() {}

    public static String finalReport(PaymentProperties props, String orderId, String reportId) {
        return finalReport(props, orderId, reportId, false);
    }

    /**
     * @param includePaidFlag Mock 模式可传 true，追加 {@code paid=1}（前端可忽略）
     */
    public static String finalReport(
            PaymentProperties props,
            String orderId,
            String reportId,
            boolean includePaidFlag
    ) {
        StringBuilder url = new StringBuilder(props.getFrontendUrl())
                .append("/generator/final-report?orderId=")
                .append(encode(orderId))
                .append("&reportId=")
                .append(encode(reportId));
        if (includePaidFlag) {
            url.append("&paid=1");
        }
        return url.toString();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
