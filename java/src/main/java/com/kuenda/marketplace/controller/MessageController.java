package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.ChatService;
import com.kuenda.marketplace.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<Message> sendMessage(@Valid @RequestBody MessageRequestDTO dto) {
        String senderId = SecurityUtils.requireCurrentUserId();

        Chat chat = chatService.getChatById(dto.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat não encontrado com o ID: " + dto.getChatId()));

        // Garante que apenas o comprador ou o vendedor deste chat pode enviar mensagens
        SecurityUtils.requireParticipantOrAdmin(chat.getBuyerId(), chat.getSellerId(), "enviar mensagens nesta conversa");

        String recipientId = senderId.equals(chat.getBuyerId()) ? chat.getSellerId() : chat.getBuyerId();
        dto.setSenderId(senderId);
        dto.setRecipientId(recipientId);

        Message created = messageService.saveAndBroadcastMessage(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
