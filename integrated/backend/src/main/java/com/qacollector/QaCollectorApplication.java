package com.qacollector;

import com.lifeblueprint.config.AlipayProperties;
import com.lifeblueprint.config.MetaProperties;
import com.lifeblueprint.config.PayPalProperties;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.config.ProxyProperties;
import com.lifeblueprint.config.WechatPayProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(scanBasePackages = {"com.qacollector", "com.lifeblueprint"})
@EnableConfigurationProperties({PaymentProperties.class, AlipayProperties.class, WechatPayProperties.class, PayPalProperties.class, MetaProperties.class, ProxyProperties.class})
public class QaCollectorApplication {
    public static void main(String[] args) {
        SpringApplication.run(QaCollectorApplication.class, args);
    }
}
