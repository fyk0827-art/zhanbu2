package com.lifeblueprint.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> forbidden(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> dataAccess(DataAccessException ex) {
        String detail = ex.getMostSpecificCause().getMessage();
        String message = "数据库错误：请确认 MySQL 已启动且 orders/reports/unlocks 表已创建（重启后端可自动建表）";
        if (detail != null && !detail.isBlank()) {
            message = message + "（" + detail + "）";
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", message));
    }

    /** 浏览器/IDE 探测类请求，避免刷 ERROR 堆栈 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Void> noResource(NoResourceFoundException ex, HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.contains(".well-known") || uri.endsWith("/favicon.ico")) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> serverError(Exception ex) {
        ex.printStackTrace();
        String message = ex.getMessage() != null ? ex.getMessage() : "服务器内部错误";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", message));
    }
}
