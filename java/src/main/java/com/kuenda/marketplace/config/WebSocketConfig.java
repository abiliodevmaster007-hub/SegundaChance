package com.kuenda.marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita broker simples para tópicos em memória
        // /topic para canais públicos, chats específicos e notificações
        config.enableSimpleBroker("/topic");
        
        // Prefixo para mensagens enviadas do cliente para métodos @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket compatível com SockJS (utilizado pelo @stomp/stompjs no frontend)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Endpoint WebSocket nativo direto
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}
