package com.kuenda.marketplace.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secretKey = "KuendaMarketplaceSuperSecretKey2026AngolaVerySecureForJwtSigning!";
    private final long expirationMs = 3600000; // 1 hora

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(secretKey, expirationMs);
    }

    @Test
    @DisplayName("Deve gerar um token JWT válido e não vazio")
    void shouldGenerateValidToken() {
        String token = jwtTokenProvider.generateToken("user_123", "antonio@kuenda.ao", "USER");

        assertNotNull(token);
        assertFalse(token.trim().isEmpty());
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Deve extrair corretamente o ID do utilizador e as claims do token")
    void shouldExtractUserIdAndClaimsFromToken() {
        String userId = "user_456";
        String email = "maria@kuenda.ao";
        String role = "ADMIN";

        String token = jwtTokenProvider.generateToken(userId, email, role);

        assertEquals(userId, jwtTokenProvider.getUserIdFromJWT(token));

        Claims claims = jwtTokenProvider.getClaimsFromJWT(token);
        assertEquals(email, claims.get("email"));
        assertEquals(role, claims.get("role"));
    }

    @Test
    @DisplayName("Deve invalidar tokens malformatados, nulos ou adulterados")
    void shouldRejectInvalidTokens() {
        assertFalse(jwtTokenProvider.validateToken(null));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken("token.invalido.malformado"));
    }

    @Test
    @DisplayName("Deve rejeitar token expirado")
    void shouldRejectExpiredToken() {
        // Provider com expiração de -1000ms (já expirado)
        JwtTokenProvider expiredProvider = new JwtTokenProvider(secretKey, -1000);
        String expiredToken = expiredProvider.generateToken("user_789", "teste@kuenda.ao", "USER");

        assertFalse(jwtTokenProvider.validateToken(expiredToken));
    }
}
