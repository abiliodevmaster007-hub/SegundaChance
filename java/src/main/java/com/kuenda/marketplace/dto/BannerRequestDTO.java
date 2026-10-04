package com.kuenda.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerRequestDTO {

    @NotBlank(message = "O título do banner é obrigatório")
    private String title;

    private String subtitle;

    @NotBlank(message = "A imagem do banner é obrigatória")
    private String imageUrl;

    private String linkUrl;

    private String targetUrl;

    @Builder.Default
    private String position = "left";

    private String planId;

    private Double pricePaid;

    private String paymentStatus;

    private String paymentMethod;

    private String advertiserName;

    private String advertiserEmail;

    private Integer durationDays;

    private String userId;

    private String listingId;

    private String expiresAt;

    @Builder.Default
    private Boolean active = true;
}
