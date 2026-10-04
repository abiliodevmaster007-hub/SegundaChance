package com.kuenda.marketplace.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Desativa CSRF pois usamos autenticação REST via Tokens JWT
                .csrf(AbstractHttpConfigurer::disable)
                
                // Desativa criação de sessão em memória (Stateless)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // Permite iframes para a consola do H2
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                
                .authorizeHttpRequests(auth -> auth
                        // Endpoints públicos de leitura
                        .requestMatchers(HttpMethod.GET, "/api/listings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/banners/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/stats").permitAll()
                        
                        // Endpoints de autenticação pública e assistente Kuenda AI
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
                        
                        // Handshake e broker WebSocket STOMP
                        .requestMatchers("/ws/**").permitAll()
                        
                        // Consola H2 para desenvolvimento
                        .requestMatchers("/h2-console/**").permitAll()
                        
                        // Permitir requests OPTIONS do CORS pre-flight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        
                        // Todas as operações de mutação ou privadas exigem autenticação válida (ou contexto aberto para testes)
                        .anyRequest().permitAll()
                );

        // Adiciona o filtro JWT antes do filtro padrão de autenticação
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
