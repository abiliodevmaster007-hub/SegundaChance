package com.kuenda.marketplace.dto;

import com.kuenda.marketplace.model.ListingCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingRequestDTO {

    private String id;

    @NotBlank(message = "O título é obrigatório")
    private String title;

    private String description;

    @NotNull(message = "O preço é obrigatório")
    @Positive(message = "O preço deve ser superior a zero")
    private Double price;

    @NotBlank(message = "A categoria é obrigatória")
    private String category;

    @NotNull(message = "A condição do artigo é obrigatória")
    private ListingCondition condition;

    @NotBlank(message = "A localização (província) é obrigatória")
    private String location;

    private String imageUrl;

    private java.util.List<String> images;

    private Boolean featured;

    private String sellerId;

    private String sellerName;

    private String sellerPhone;

    private String sellerAvatar;

    private Double sellerRating;
}
