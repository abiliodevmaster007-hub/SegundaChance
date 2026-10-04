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
    @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres")
    private String name;

    @NotBlank(message = "O endereço de e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    private String email;

    @NotBlank(message = "A palavra-passe é obrigatória")
    @Size(min = 6, max = 100, message = "A palavra-passe deve ter pelo menos 6 caracteres")
    private String password;

    @Size(max = 30, message = "O número de telefone não pode exceder 30 caracteres")
    private String phone;

    @Size(max = 60, message = "A localização não pode exceder 60 caracteres")
    private String location;
}
