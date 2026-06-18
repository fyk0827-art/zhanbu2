package com.qacollector.controller;

import com.qacollector.dto.AgeGroupDTO;
import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.SetUnifiedPriceRequest;
import com.qacollector.service.AgeGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/age-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgeGroupController {
    private final AgeGroupService ageGroupService;

    @GetMapping
    public ApiResponse<List<AgeGroupDTO>> list() {
        return ApiResponse.ok(ageGroupService.listAll());
    }

    @PutMapping("/admin/price")
    public ApiResponse<Void> setUnifiedPrice(@RequestBody SetUnifiedPriceRequest req) {
        if (req.getPrice() == null || req.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        ageGroupService.setUnifiedPrice(req.getPrice());
        return ApiResponse.ok(null);
    }
}
