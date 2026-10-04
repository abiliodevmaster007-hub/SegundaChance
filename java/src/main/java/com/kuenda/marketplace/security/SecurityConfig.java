package com.kuenda.marketplace.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
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

import java.nio.charset.StandardCharsets;

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
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            response.getWriter().write("{\"error\":\"Autenticação obrigatória. Token JWT ausente ou inválido.\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            response.getWriter().write("{\"error\":\"Acesso negado. Permissão insuficiente para este recurso.\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Autenticação pública (apenas login e registo; /api/auth/me exige autenticação)
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()

                        // Leitura pública do catálogo, banners e perfil público individual
                        .requestMatchers(HttpMethod.GET, "/api/listings", "/api/listings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/banners", "/api/banners/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()

                        // Submissão de campanha de banner exige utilizador autenticado; ativação/edição/remoção e listagem global de utilizadores exigem ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/banners").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/banners/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/banners/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/banners/**").hasRole("ADMIN")

                        // Handshake WebSocket
                        .requestMatchers("/ws/**").permitAll()

                        // Rotas administrativas exigem estritamente ROLE_ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Estado de saúde do motor Kuenda AI público; ferramentas e chat de IA exigem utilizador autenticado
                        .requestMatchers(HttpMethod.GET, "/api/ai/status").permitAll()
                        .requestMatchers("/api/ai/**").authenticated()

                        // Qualquer outra rota (POST/PUT/PATCH/DELETE de anúncios, chats, mensagens, edição de perfil) exige autenticação
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
