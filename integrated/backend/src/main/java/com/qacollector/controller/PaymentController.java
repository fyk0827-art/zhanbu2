package com.qacollector.controller;

import com.qacollector.dto.*;
import com.qacollector.service.LocalPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final LocalPaymentService localPaymentService;

    @PostMapping("/create")
    public ApiResponse<PaymentCreateResponse> create(@RequestBody PaymentCreateRequest req) {
        return ApiResponse.ok(localPaymentService.createPayment(req));
    }

    @PostMapping("/complete")
    public ApiResponse<PaymentCompleteResponse> complete(@RequestBody PaymentCompleteRequest req) {
        return ApiResponse.ok(localPaymentService.completePayment(req));
    }
}
