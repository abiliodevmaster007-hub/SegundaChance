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
public class RegisterRequestDTO {

    @NotBlank(message = "O nome completo é obrigatório")
    private String name;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email com formato inválido")
    private String email;

    @NotBlank(message = "A palavra-passe é obrigatória")
    @Size(min = 6, message = "A palavra-passe deve ter pelo menos 6 caracteres")
    private String password;

    private String phone;

    private String location;
}
