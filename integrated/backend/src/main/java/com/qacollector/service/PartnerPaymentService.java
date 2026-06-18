package com.qacollector.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qacollector.config.PartnerProperties;
import com.qacollector.dto.PartnerConfirmRequest;
import com.qacollector.dto.PartnerConfirmResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PartnerPaymentService {

    private final PartnerProperties partnerProperties;
    private final ObjectMapper objectMapper;

    public PartnerConfirmResponse confirmPayment(PartnerConfirmRequest req) {
        if (req.getTradeNo() == null || req.getTradeNo().isBlank()) {
            throw new IllegalArgumentException("tradeNo is required");
        }
        if (partnerProperties.getWebhookSecret() == null || partnerProperties.getWebhookSecret().isBlank()) {
            throw new IllegalStateException("Partner webhook secret is not configured");
        }

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("tradeNo", req.getTradeNo());
            body.put("amount", partnerProperties.getStandardAmountCents());
            if (req.getPayerContact() != null && !req.getPayerContact().isBlank()) {
                body.put("payerContact", req.getPayerContact());
            }

            String rawBody = objectMapper.writeValueAsString(body);
            String signature = sign(rawBody, partnerProperties.getWebhookSecret());

            String url = partnerProperties.getApiBaseUrl().replaceAll("/$", "")
                + "/api/partner/confirm-payment";

            RestClient client = RestClient.create();
            PartnerConfirmResponse response = client.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Partner-Signature", signature)
                .body(rawBody)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, res) -> {
                    throw new RestClientResponseException(
                        "Partner confirm-payment failed",
                        res.getStatusCode().value(),
                        res.getStatusCode().toString(),
                        res.getHeaders(),
                        null,
                        null
                    );
                })
                .body(PartnerConfirmResponse.class);

            if (response == null || !response.isOk()) {
                throw new RuntimeException("Partner confirm-payment failed");
            }
            if (response.getFrontendUrl() == null || response.getFrontendUrl().isBlank()) {
                throw new RuntimeException("Partner did not return frontendUrl");
            }
            return response;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Partner confirm-payment error: " + e.getMessage(), e);
        }
    }

    private static String sign(String rawBody, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash).toLowerCase();
    }
}
