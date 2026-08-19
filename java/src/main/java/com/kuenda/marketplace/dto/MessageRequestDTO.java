package com.kuenda.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequestDTO {

    @NotBlank(message = "O ID do chat é obrigatório")
    private String chatId;

    @NotBlank(message = "O ID do remetente é obrigatório")
    private String senderId;

    @NotBlank(message = "O ID do destinatário é obrigatório")
    private String recipientId;

    @NotBlank(message = "O texto da mensagem não pode estar vazio")
    private String text;
}
