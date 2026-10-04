package com.kuenda.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRequestDTO {

    @NotBlank(message = "O endereço de e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    private String email;

    @NotBlank(message = "A palavra-passe é obrigatória")
    @Size(min = 6, max = 100, message = "A palavra-passe deve ter entre 6 e 100 caracteres")
    private String password;
}
