package com.kuenda.marketplace.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketTypingDTO {
    private String chatId;
    private String userId;
    private String userName;
    private boolean typing;
}
