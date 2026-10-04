package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<Message> getMessagesForChat(String chatId) {
        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
    }

    /**
     * Único fluxo autoritativo de persistência e difusão em tempo real das mensagens.
     */
    @Transactional
    public Message saveAndBroadcastMessage(MessageRequestDTO dto) {
        String now = Instant.now().toString();

        Message message = Message.builder()
                .id("msg_" + UUID.randomUUID().toString().substring(0, 8))
                .chatId(dto.getChatId())
                .senderId(dto.getSenderId())
                .recipientId(dto.getRecipientId())
                .text(dto.getText())
                .createdAt(now)
                .build();

        Message saved = messageRepository.save(message);

        // Atualiza a pré-visualização do chat com a última mensagem
        chatService.updateLastMessage(dto.getChatId(), dto.getText(), now);

        // Difunde mensagem em tempo real para o canal do chat e para o canal privado do destinatário
        try {
            messagingTemplate.convertAndSend("/topic/chats/" + dto.getChatId(), saved);
            messagingTemplate.convertAndSend("/topic/messages/" + dto.getRecipientId(), saved);
            messagingTemplate.convertAndSend("/topic/users/" + dto.getRecipientId() + "/notifications", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir mensagem via WebSocket: {}", e.getMessage());
        }

        return saved;
    }
}
