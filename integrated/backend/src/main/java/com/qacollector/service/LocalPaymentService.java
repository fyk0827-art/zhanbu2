package com.qacollector.service;

import com.qacollector.config.PartnerProperties;
import com.qacollector.dto.*;
import com.qacollector.entity.AgeGroup;
import com.qacollector.entity.PaymentRecord;
import com.qacollector.entity.Question;
import com.qacollector.repository.AgeGroupRepository;
import com.qacollector.repository.PaymentRecordRepository;
import com.qacollector.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocalPaymentService {

    private final PaymentRecordRepository paymentRepository;
    private final QuestionRepository questionRepository;
    private final AgeGroupRepository ageGroupRepository;
    private final PartnerPaymentService partnerPaymentService;
    private final InternalPrepaidService internalPrepaidService;
    private final SettingsService settingsService;
    private final PartnerProperties partnerProperties;

    @Transactional
    public PaymentCreateResponse createPayment(PaymentCreateRequest req) {
        if (req.getQuestionId() == null) {
            throw new IllegalArgumentException("questionId is required");
        }

        Question question = questionRepository.findById(req.getQuestionId())
            .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        AgeGroup ageGroup = ageGroupRepository.findById(question.getAgeGroupId())
            .orElseThrow(() -> new IllegalArgumentException("Age group not found"));

        String tradeNo = "pay_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

        PaymentRecord payment = new PaymentRecord();
        payment.setTradeNo(tradeNo);
        payment.setQuestionId(question.getId());
        payment.setAgeGroupId(ageGroup.getId());
        payment.setAmount(ageGroup.getPrice());
        payment.setCurrency("CNY");
        payment.setStatus("pending");
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        PaymentCreateResponse res = new PaymentCreateResponse();
        res.setTradeNo(tradeNo);
        res.setAmount(ageGroup.getPrice());
        res.setCurrency("CNY");
        res.setStatus("pending");
        return res;
    }

    @Transactional
    public PaymentCompleteResponse completePayment(PaymentCompleteRequest req) {
        if (req.getTradeNo() == null || req.getTradeNo().isBlank()) {
            throw new IllegalArgumentException("tradeNo is required");
        }

        PaymentRecord payment = paymentRepository.findByTradeNo(req.getTradeNo())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if ("completed".equals(payment.getStatus()) && payment.getPartnerFrontendUrl() != null) {
            return toCompleteResponse(payment);
        }

        if (!"mock".equals(settingsService.getPaymentMode())) {
            throw new IllegalStateException("Live payment is not configured yet");
        }

        payment.setStatus("completed");
        payment.setCompletedAt(LocalDateTime.now());

        PartnerConfirmRequest partnerReq = new PartnerConfirmRequest();
        partnerReq.setTradeNo(payment.getTradeNo());

        PartnerConfirmResponse partnerRes;
        if ("local".equalsIgnoreCase(partnerProperties.getMode())) {
            partnerRes = internalPrepaidService.confirmPrepaid(payment.getTradeNo(), null);
        } else {
            partnerRes = partnerPaymentService.confirmPayment(partnerReq);
        }
        payment.setPartnerOrderId(partnerRes.getOrderId());
        payment.setPartnerFrontendUrl(partnerRes.getFrontendUrl());
        paymentRepository.save(payment);

        return toCompleteResponse(payment);
    }

    private PaymentCompleteResponse toCompleteResponse(PaymentRecord payment) {
        PaymentCompleteResponse res = new PaymentCompleteResponse();
        res.setTradeNo(payment.getTradeNo());
        res.setStatus(payment.getStatus());
        res.setOrderId(payment.getPartnerOrderId());
        res.setFrontendUrl(payment.getPartnerFrontendUrl());
        return res;
    }
}
