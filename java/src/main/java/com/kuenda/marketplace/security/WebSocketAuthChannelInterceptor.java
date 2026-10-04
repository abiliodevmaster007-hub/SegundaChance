package com.kuenda.marketplace.security;

import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.repository.ChatRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.Collections;
import java.util.List;

/**
 * Interceptor STOMP para autenticação via JWT no CONNECT e validação de propriedade (ownership)
 * em subscrições (SUBSCRIBE) e envios (SEND) de canais de chat e notificações privadas.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final ChatRepository chatRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            authenticateStompConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeStompSubscription(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            authorizeStompSend(accessor);
        }

        return message;
    }

    private void authenticateStompConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (!StringUtils.hasText(authHeader)) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            log.warn("Conexão STOMP rejeitada: cabeçalho Authorization Bearer ausente.");
            throw new AccessDeniedException("Autenticação WebSocket obrigatória: token JWT ausente.");
        }

        String token = authHeader.substring(7).trim();
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("Conexão STOMP rejeitada: token JWT inválido ou expirado.");
            throw new AccessDeniedException("Autenticação WebSocket recusada: token JWT inválido ou expirado.");
        }

        Claims claims = jwtTokenProvider.getClaimsFromJWT(token);
        String userId = claims.getSubject();
        String role = claims.get("role", String.class);

        String normalizedRole = StringUtils.hasText(role) ? role.trim().toUpperCase() : "USER";
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }

        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + normalizedRole)
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);
        accessor.setUser(authentication);
    }

    private void authorizeStompSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (!StringUtils.hasText(destination)) {
            return;
        }

        // Tópicos públicos do catálogo de anúncios são permitidos
        if (destination.startsWith("/topic/listings")) {
            return;
        }

        Principal userPrincipal = accessor.getUser();
        if (userPrincipal == null || !StringUtils.hasText(userPrincipal.getName())) {
            throw new AccessDeniedException("Subscrição STOMP negada: sessão não autenticada.");
        }

        String currentUserId = userPrincipal.getName();
        boolean isAdmin = isAdminPrincipal(userPrincipal);

        // Protege canais privados de utilizador: /topic/users/{userId}/... e /topic/messages/{userId}
        if (destination.startsWith("/topic/users/")) {
            String[] parts = destination.split("/");
            if (parts.length >= 4) {
                String targetUserId = parts[3];
                if (!isAdmin && !currentUserId.equals(targetUserId)) {
                    throw new AccessDeniedException("Subscrição STOMP negada: canal privado de outro utilizador.");
                }
            }
            return;
        }

        if (destination.startsWith("/topic/messages/")) {
            String[] parts = destination.split("/");
            if (parts.length >= 4) {
                String targetUserId = parts[3];
                if (!isAdmin && !currentUserId.equals(targetUserId)) {
                    throw new AccessDeniedException("Subscrição STOMP negada: canal de mensagens de outro utilizador.");
                }
            }
            return;
        }

        // Protege canais de chat: /topic/chats/{chatId} e /topic/chats/{chatId}/typing
        if (destination.startsWith("/topic/chats/")) {
            String[] parts = destination.split("/");
            if (parts.length >= 4) {
                String chatId = parts[3];
                Chat chat = chatRepository.findById(chatId)
                        .orElseThrow(() -> new AccessDeniedException("Subscrição STOMP negada: conversa inexistente."));

                boolean isParticipant = currentUserId.equals(chat.getBuyerId())
                        || currentUserId.equals(chat.getSellerId());
                if (!isAdmin && !isParticipant) {
                    throw new AccessDeniedException("Subscrição STOMP negada: não é participante desta conversa.");
                }
            }
        }
    }

    private void authorizeStompSend(StompHeaderAccessor accessor) {
        Principal userPrincipal = accessor.getUser();
        if (userPrincipal == null || !StringUtils.hasText(userPrincipal.getName())) {
            throw new AccessDeniedException("Envio STOMP negado: sessão WebSocket não autenticada.");
        }
    }

    private boolean isAdminPrincipal(Principal principal) {
        if (principal instanceof Authentication auth && auth.getAuthorities() != null) {
            for (GrantedAuthority authority : auth.getAuthorities()) {
                if ("ROLE_ADMIN".equalsIgnoreCase(authority.getAuthority())
                        || "ADMIN".equalsIgnoreCase(authority.getAuthority())) {
                    return true;
                }
            }
        }
        return false;
    }
}
