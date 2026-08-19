package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.ChatRequestDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.repository.ChatRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChatService chatService;

    @Test
    @DisplayName("Deve retornar chat existente sem criar duplicatas para o mesmo anúncio e comprador")
    void shouldReturnExistingChatWithoutDuplicating() {
        Chat existing = Chat.builder()
                .id("chat_100")
                .listingId("list_1")
                .buyerId("user_buyer")
                .sellerId("user_seller")
                .build();

        ChatRequestDTO dto = ChatRequestDTO.builder()
                .listingId("list_1")
                .buyerId("user_buyer")
                .sellerId("user_seller")
                .build();

        when(chatRepository.findByListingIdAndBuyerId("list_1", "user_buyer")).thenReturn(Optional.of(existing));

        Chat result = chatService.createOrGetChat(dto);

        assertEquals("chat_100", result.getId());
        verify(chatRepository, never()).save(any(Chat.class));
    }

    @Test
    @DisplayName("Deve criar novo chat quando não houver conversa prévia")
    void shouldCreateNewChatWhenNotExists() {
        ChatRequestDTO dto = ChatRequestDTO.builder()
                .listingId("list_2")
                .buyerId("user_new_buyer")
                .sellerId("user_seller")
                .initialMessage("Olá! Está disponível?")
                .build();

        when(chatRepository.findByListingIdAndBuyerId("list_2", "user_new_buyer")).thenReturn(Optional.empty());
        when(chatRepository.save(any(Chat.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Chat result = chatService.createOrGetChat(dto);

        assertNotNull(result);
        assertEquals("list_2", result.getListingId());
        assertEquals("user_new_buyer", result.getBuyerId());
        assertEquals("Olá! Está disponível?", result.getLastMessageText());

        verify(chatRepository, times(1)).save(any(Chat.class));
    }
}
