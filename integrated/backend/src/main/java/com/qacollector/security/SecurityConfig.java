package com.qacollector.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - no auth required
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/questions").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/questions/answer").permitAll()
                .requestMatchers("/api/questions/random").permitAll()
                .requestMatchers("/api/questions/by-age/**").permitAll()
                .requestMatchers("/api/answers").permitAll()
                .requestMatchers("/api/payments/**").permitAll()
                .requestMatchers("/api/settings/public").permitAll()
                // 生成器 API（报告、订单、支付回调）
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/reports/**").permitAll()
                .requestMatchers("/api/orders/**").permitAll()
                .requestMatchers("/api/unlock/**").permitAll()
                .requestMatchers("/api/report-prompts/**").permitAll()
                .requestMatchers("/api/partner/**").permitAll()
                .requestMatchers("/api/alipay/**").permitAll()
                .requestMatchers("/api/wechat/**").permitAll()
                .requestMatchers("/api/paypal/**").permitAll()
                .requestMatchers("/api/dev/**").permitAll()
                .requestMatchers("/api/world/**").permitAll()
                .requestMatchers("/api/notify/**").permitAll()
                // Admin-only endpoints (specific paths before public wildcards)
                .requestMatchers("/api/admin/settings/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/age-groups/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/admin/questions/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/admin/answers/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/age-groups/**").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
