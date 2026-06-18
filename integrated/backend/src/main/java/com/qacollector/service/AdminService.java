package com.qacollector.service;

import com.qacollector.dto.LoginRequest;
import com.qacollector.dto.LoginResponse;
import com.qacollector.entity.AdminUser;
import com.qacollector.repository.AdminUserRepository;
import com.qacollector.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminUserRepository repository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;

    public LoginResponse login(LoginRequest req) {
        AdminUser admin = repository.findByUsernameAndIsActiveTrue(req.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(req.getPassword(), admin.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        admin.setLastLoginAt(LocalDateTime.now());
        repository.save(admin);

        String token = jwtUtil.generateToken(admin.getUsername(), admin.getRole());
        LoginResponse res = new LoginResponse();
        res.setToken(token);
        res.setRole(admin.getRole());
        return res;
    }
}
