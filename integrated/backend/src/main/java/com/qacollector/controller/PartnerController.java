package com.qacollector.controller;

import com.qacollector.service.InternalPrepaidService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/partner")
@RequiredArgsConstructor
public class PartnerController {

    private final InternalPrepaidService internalPrepaidService;

    @GetMapping("/orders/{orderId}")
    public Map<String, Object> orderInfo(@PathVariable String orderId) {
        return internalPrepaidService.orderInfo(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }

    @PostMapping("/bind-report")
    public Map<String, Object> bindReport(@RequestBody Map<String, String> body) {
        String orderId = body.get("orderId");
        String reportId = body.get("reportId");
        return internalPrepaidService.bindReport(orderId, reportId);
    }
}
