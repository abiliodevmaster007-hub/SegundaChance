package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.ChatRequestDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRepository chatRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<Chat> getChatsForUser(String userId) {
        return chatRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Optional<Chat> getChatById(String id) {
        return chatRepository.findById(id);
    }

    @Transactional
    public Chat createOrGetChat(ChatRequestDTO dto) {
        // Verifica se já existe um chat ativo entre o comprador e este anúncio
        Optional<Chat> existing = chatRepository.findByListingIdAndBuyerId(dto.getListingId(), dto.getBuyerId());
        if (existing.isPresent()) {
            return existing.get();
        }

        Chat chat = Chat.builder()
                .id("chat_" + UUID.randomUUID().toString().substring(0, 8))
                .listingId(dto.getListingId())
                .listingTitle(dto.getListingTitle() != null ? dto.getListingTitle() : "Artigo Kuenda")
                .listingPrice(dto.getListingPrice() != null ? dto.getListingPrice() : 0.0)
                .listingImageUrl(dto.getListingImageUrl())
                .buyerId(dto.getBuyerId())
                .buyerName(dto.getBuyerName() != null ? dto.getBuyerName() : "Comprador")
                .sellerId(dto.getSellerId())
                .sellerName(dto.getSellerName() != null ? dto.getSellerName() : "Vendedor")
                .lastMessageText(dto.getInitialMessage() != null ? dto.getInitialMessage() : "Conversa iniciada")
                .lastMessageTime(Instant.now().toString())
                .createdAt(Instant.now().toString())
                .build();

        Chat saved = chatRepository.save(chat);
        log.info("Novo chat criado: {} entre comprador {} e vendedor {}", saved.getId(), saved.getBuyerId(), saved.getSellerId());

        try {
            messagingTemplate.convertAndSend("/topic/users/" + saved.getBuyerId() + "/chats", saved);
            messagingTemplate.convertAndSend("/topic/users/" + saved.getSellerId() + "/chats", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir evento de novo chat: {}", e.getMessage());
        }

        return saved;
    }

    @Transactional
    public void updateLastMessage(String chatId, String messageText, String time) {
        chatRepository.findById(chatId).ifPresent(chat -> {
            chat.setLastMessageText(messageText);
            chat.setLastMessageTime(time);
            Chat updated = chatRepository.save(chat);

            try {
                messagingTemplate.convertAndSend("/topic/users/" + updated.getBuyerId() + "/chats", updated);
                messagingTemplate.convertAndSend("/topic/users/" + updated.getSellerId() + "/chats", updated);
            } catch (Exception e) {
                log.warn("Erro ao emitir atualização do chat: {}", e.getMessage());
            }
        });
    }
}
