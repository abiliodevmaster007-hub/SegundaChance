package com.kuenda.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.dto.ChatRequestDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.security.JwtAuthenticationFilter;
import com.kuenda.marketplace.security.JwtTokenProvider;
import com.kuenda.marketplace.service.ChatService;
import com.kuenda.marketplace.service.MessageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChatController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatService chatService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private ListingRepository listingRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("GET /api/chats deve retornar HTTP 200 e lista de conversas")
    void shouldReturnChatsWithStatus200() throws Exception {
        Chat chat = Chat.builder()
                .id("chat_1")
                .listingId("list_1")
                .listingTitle("iPhone 13")
                .buyerId("u_maria")
                .sellerId("u_antonio")
                .build();

        when(chatService.getChatsForUser("u_maria")).thenReturn(Collections.singletonList(chat));

        mockMvc.perform(get("/api/chats?userId=u_maria"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("chat_1"))
                .andExpect(jsonPath("$[0].listingTitle").value("iPhone 13"));
    }

    @Test
    @DisplayName("POST /api/chats/start deve iniciar conversa para o anúncio")
    void shouldStartChatSuccessfully() throws Exception {
        Listing listing = Listing.builder()
                .id("list_10")
                .title("Toyota Prado")
                .price(28500000.0)
                .sellerId("u_antonio")
                .sellerName("António")
                .build();

        Chat created = Chat.builder()
                .id("chat_new")
                .listingId("list_10")
                .listingTitle("Toyota Prado")
                .buyerId("u_maria")
                .sellerId("u_antonio")
                .build();

        when(listingRepository.findById("list_10")).thenReturn(Optional.of(listing));
        when(chatService.createOrGetChat(any(ChatRequestDTO.class))).thenReturn(created);

        mockMvc.perform(post("/api/chats/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("listingId", "list_10"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("chat_new"))
                .andExpect(jsonPath("$.listingTitle").value("Toyota Prado"));
    }

    @Test
    @DisplayName("POST /api/chats/{chatId}/messages deve gravar mensagem e retornar HTTP 201")
    void shouldPostMessageToChat() throws Exception {
        Chat chat = Chat.builder()
                .id("chat_1")
                .buyerId("u_maria")
                .sellerId("u_antonio")
                .build();

        Message msg = Message.builder()
                .id("msg_1")
                .chatId("chat_1")
                .senderId("u_maria")
                .recipientId("u_antonio")
                .text("Olá, ainda disponível?")
                .build();

        when(chatService.getChatById("chat_1")).thenReturn(Optional.of(chat));
        when(messageService.saveAndBroadcastMessage(any())).thenReturn(msg);

        mockMvc.perform(post("/api/chats/chat_1/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "Olá, ainda disponível?"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("msg_1"))
                .andExpect(jsonPath("$.text").value("Olá, ainda disponível?"));
    }
}
