package com.qacollector.controller;

import com.qacollector.dto.*;
import com.qacollector.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    private final AdminService adminService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest req) {
        return ApiResponse.ok(adminService.login(req));
    }

    @GetMapping("/me")
    public ApiResponse<String> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }
        return ApiResponse.ok(auth.getName());
    }
}
