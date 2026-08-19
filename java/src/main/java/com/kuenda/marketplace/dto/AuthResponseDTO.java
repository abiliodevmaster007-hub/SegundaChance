package com.kuenda.marketplace.dto;

import com.kuenda.marketplace.model.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {

    private String token;
    
    @Builder.Default
    private String tokenType = "Bearer";

    private User user;
}
