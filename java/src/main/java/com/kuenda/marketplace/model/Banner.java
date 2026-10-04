package com.kuenda.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Builder.Default
    private String subtitle = "Destaque SegundaChance";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Builder.Default
    @Column(nullable = false)
    private String linkUrl = "#";

    @Builder.Default
    @Column(nullable = false)
    private String position = "left";

    @Builder.Default
    private String planId = "pro";

    @Builder.Default
    private Double pricePaid = 0.0;

    @Builder.Default
    private String paymentStatus = "pago";

    @Builder.Default
    private String paymentMethod = "multicaixa_express";

    @Builder.Default
    private String advertiserName = "Parceiro SegundaChance";

    @Builder.Default
    private String advertiserEmail = "";

    private String userId;

    private String listingId;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private String expiresAt = Instant.now().plus(30, ChronoUnit.DAYS).toString();

    @Builder.Default
    private String createdAt = Instant.now().toString();

    public String getTargetUrl() {
        return this.linkUrl;
    }

    public void setTargetUrl(String targetUrl) {
        if (targetUrl != null && !targetUrl.isBlank()) {
            this.linkUrl = targetUrl;
        }
    }
}
