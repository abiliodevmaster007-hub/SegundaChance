package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.dto.WebSocketTypingDTO;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Tratamento de envio de mensagens via STOMP /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void handleSendMessage(@Payload MessageRequestDTO messageDto) {
        log.info("Mensagem recebida via WebSocket de {} para chat {}", messageDto.getSenderId(), messageDto.getChatId());
        messageService.saveAndBroadcastMessage(messageDto);
    }

    /**
     * Tratamento de indicador de digitação ("A escrever...") via /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload WebSocketTypingDTO typingDto) {
        if (typingDto.getChatId() != null) {
            messagingTemplate.convertAndSend("/topic/chats/" + typingDto.getChatId() + "/typing", typingDto);
        }
    }
}
