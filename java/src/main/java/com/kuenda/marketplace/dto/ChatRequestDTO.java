package com.kuenda.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequestDTO {

    @NotBlank(message = "O ID do anúncio é obrigatório")
    private String listingId;

    private String listingTitle;

    private Double listingPrice;

    private String listingImageUrl;

    @NotBlank(message = "O ID do comprador é obrigatório")
    private String buyerId;

    private String buyerName;

    @NotBlank(message = "O ID do vendedor é obrigatório")
    private String sellerId;

    private String sellerName;

    private String initialMessage;
}
