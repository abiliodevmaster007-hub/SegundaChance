package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.dto.WebSocketTypingDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.service.ChatService;
import com.kuenda.marketplace.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final MessageService messageService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Tratamento de envio direto de mensagens via STOMP /app/chat.send
     * Valida o Principal autenticado via JWT e se o remetente pertence ao chat.
     */
    @MessageMapping("/chat.send")
    public void handleSendMessage(@Payload MessageRequestDTO messageDto, Principal principal) {
        if (principal == null || !StringUtils.hasText(principal.getName())) {
            throw new AccessDeniedException("Sessão STOMP não autenticada.");
        }
        if (messageDto == null || !StringUtils.hasText(messageDto.getChatId()) || !StringUtils.hasText(messageDto.getText())) {
            return;
        }

        String senderId = principal.getName();
        Chat chat = chatService.getChatById(messageDto.getChatId())
                .orElseThrow(() -> new AccessDeniedException("Conversa não encontrada."));

        boolean isParticipant = senderId.equals(chat.getBuyerId()) || senderId.equals(chat.getSellerId());
        if (!isParticipant) {
            throw new AccessDeniedException("Acesso negado: não é participante desta conversa.");
        }

        String recipientId = senderId.equals(chat.getBuyerId()) ? chat.getSellerId() : chat.getBuyerId();
        messageDto.setSenderId(senderId);
        messageDto.setRecipientId(recipientId);
        messageDto.setText(messageDto.getText().trim());

        log.info("Mensagem STOMP validada de {} para chat {}", senderId, messageDto.getChatId());
        messageService.saveAndBroadcastMessage(messageDto);
    }

    /**
     * Tratamento de indicador de digitação ("A escrever...") via /app/chat.typing
     * Garante que apenas participantes autenticados do chat emitam eventos de digitação.
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload WebSocketTypingDTO typingDto, Principal principal) {
        if (principal == null || !StringUtils.hasText(principal.getName()) || typingDto == null || !StringUtils.hasText(typingDto.getChatId())) {
            return;
        }

        String senderId = principal.getName();
        Chat chat = chatService.getChatById(typingDto.getChatId()).orElse(null);
        if (chat == null || (!senderId.equals(chat.getBuyerId()) && !senderId.equals(chat.getSellerId()))) {
            throw new AccessDeniedException("Acesso negado: não é participante desta conversa.");
        }

        typingDto.setUserId(senderId);
        messagingTemplate.convertAndSend("/topic/chats/" + typingDto.getChatId() + "/typing", typingDto);
    }
}
