package com.qacollector.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trade_no", nullable = false, unique = true, length = 64)
    private String tradeNo;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "age_group_id")
    private Long ageGroupId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "CNY";

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "partner_order_id", length = 64)
    private String partnerOrderId;

    @Column(name = "partner_frontend_url", length = 512)
    private String partnerFrontendUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
