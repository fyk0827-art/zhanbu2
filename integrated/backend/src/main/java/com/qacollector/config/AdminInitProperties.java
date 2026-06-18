package com.qacollector.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "admin.init")
public class AdminInitProperties {
    /** 仅首次部署且 admin_users 为空时生效，通过环境变量注入 */
    private String username = "";
    private String password = "";
}
