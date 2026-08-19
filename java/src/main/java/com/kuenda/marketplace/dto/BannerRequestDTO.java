package com.kuenda.marketplace.dto;

import com.kuenda.marketplace.model.BannerPosition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerRequestDTO {

    @NotBlank(message = "O título do banner é obrigatório")
    private String title;

    @NotBlank(message = "A imagem do banner é obrigatória")
    private String imageUrl;

    @NotBlank(message = "O link de destino é obrigatório")
    private String targetUrl;

    @NotNull(message = "A posição do banner é obrigatória")
    private BannerPosition position;

    @Builder.Default
    private Boolean active = true;
}
