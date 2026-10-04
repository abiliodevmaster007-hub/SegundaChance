package com.kuenda.marketplace.security;

import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.repository.ChatRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthChannelInterceptorTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private MessageChannel messageChannel;

    private WebSocketAuthChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new WebSocketAuthChannelInterceptor(jwtTokenProvider, chatRepository);
    }

    @Test
    @DisplayName("CONNECT STOMP sem cabeçalho Authorization Bearer deve lançar AccessDeniedException")
    void shouldRejectStompConnectWithoutBearerToken() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, messageChannel));
    }

    @Test
    @DisplayName("CONNECT STOMP com token JWT válido deve autenticar o Principal na sessão STOMP")
    void shouldAuthenticateStompConnectWithValidJwt() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer valid.jwt.token");
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Claims claims = Jwts.claims().subject("u_antonio").add("role", "USER").build();
        when(jwtTokenProvider.validateToken("valid.jwt.token")).thenReturn(true);
        when(jwtTokenProvider.getClaimsFromJWT("valid.jwt.token")).thenReturn(claims);

        Message<?> result = interceptor.preSend(msg, messageChannel);

        assertNotNull(result);
        assertNotNull(accessor.getUser());
        assertEquals("u_antonio", accessor.getUser().getName());
    }

    @Test
    @DisplayName("SUBSCRIBE STOMP a /topic/chats/{chatId} deve bloquear terceiros e permitir participantes")
    void shouldEnforceChatParticipationOnStompSubscribe() {
        Chat chat = Chat.builder()
                .id("chat_10")
                .buyerId("u_maria")
                .sellerId("u_antonio")
                .build();

        when(chatRepository.findById("chat_10")).thenReturn(Optional.of(chat));

        // 1. Terceiro intruso tenta subscrever /topic/chats/chat_10 -> AccessDeniedException
        StompHeaderAccessor intruderAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        intruderAccessor.setDestination("/topic/chats/chat_10");
        intruderAccessor.setUser(new UsernamePasswordAuthenticationToken(
                "u_intruso", null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        ));
        intruderAccessor.setLeaveMutable(true);
        Message<byte[]> intruderMsg = MessageBuilder.createMessage(new byte[0], intruderAccessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(intruderMsg, messageChannel));

        // 2. Compradora participante subscreve /topic/chats/chat_10 -> permitido
        StompHeaderAccessor buyerAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        buyerAccessor.setDestination("/topic/chats/chat_10");
        buyerAccessor.setUser(new UsernamePasswordAuthenticationToken(
                "u_maria", null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        ));
        buyerAccessor.setLeaveMutable(true);
        Message<byte[]> buyerMsg = MessageBuilder.createMessage(new byte[0], buyerAccessor.getMessageHeaders());

        assertDoesNotThrow(() -> interceptor.preSend(buyerMsg, messageChannel));
    }

    @Test
    @DisplayName("SUBSCRIBE STOMP a /topic/messages/{userId} de outro utilizador deve lançar AccessDeniedException")
    void shouldRejectSubscribingToAnotherUsersMessageTopic() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/messages/u_antonio");
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                "u_intruso", null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        ));
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, messageChannel));
    }
}
