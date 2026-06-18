package com.qacollector.controller;

import com.qacollector.dto.ApiResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataAccess(DataAccessException e) {
        String detail = e.getMostSpecificCause().getMessage();
        String message = "Database error during payment. Ensure MySQL is running and orders table exists.";
        if (detail != null && detail.contains("orders")) {
            message = "Missing generator tables (orders/reports/unlocks). Restart backend to auto-create, or run db/schema.sql";
        }
        if (detail != null && !detail.isBlank()) {
            message = message + " Detail: " + detail;
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<ApiResponse<Void>> handlePartnerError(RestClientResponseException e) {
        String message = "Report platform rejected the payment confirmation";
        if (e.getStatusCode().value() == 403) {
            message = "Report platform rejected the amount. Standard price is ¥29.90 (2990 fen).";
        }
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(message));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntime(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(e.getMessage()));
    }
}
