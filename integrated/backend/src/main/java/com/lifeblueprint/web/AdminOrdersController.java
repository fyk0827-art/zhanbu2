package com.lifeblueprint.web;

import com.lifeblueprint.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrdersController {

    private final PaymentService paymentService;

    public AdminOrdersController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public Map<String, Object> listOrders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        return paymentService.listOrders(page, pageSize);
    }
}
