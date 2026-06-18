package com.lifeblueprint.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 拦截浏览器/Chrome DevTools 的探测请求，避免走静态资源处理器并刷 NoResourceFoundException 堆栈。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class BrowserProbeFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (isBrowserProbe(uri)) {
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static boolean isBrowserProbe(String uri) {
        if (uri == null) {
            return false;
        }
        return "/favicon.ico".equals(uri)
                || uri.startsWith("/.well-known/");
    }
}
