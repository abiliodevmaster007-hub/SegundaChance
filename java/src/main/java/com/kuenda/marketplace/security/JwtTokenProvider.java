package com.kuenda.marketplace.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class JwtTokenProvider {

    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey secretKey;
    private final long jwtExpirationInMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationInMs) {
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException(
                    "Configuração crítica em falta: 'app.jwt.secret' (variável de ambiente JWT_SECRET) é obrigatória."
            );
        }
        byte[] keyBytes = secret.trim().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "Configuração insegura: 'app.jwt.secret' (JWT_SECRET) deve ter pelo menos 32 bytes (256 bits) para HMAC-SHA256."
            );
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.jwtExpirationInMs = jwtExpirationInMs;
    }

    /**
     * Gera um token JWT assinado contendo ID do utilizador (sub), email e role.
     */
    public String generateToken(String userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        String normalizedRole = StringUtils.hasText(role) ? role.trim().toUpperCase() : "USER";

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", normalizedRole);

        return Jwts.builder()
                .subject(userId)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Extrai o Subject (ID do Utilizador) do token JWT.
     */
    public String getUserIdFromJWT(String token) {
        return getClaimsFromJWT(token).getSubject();
    }

    /**
     * Extrai a role do utilizador a partir das claims do token JWT.
     */
    public String getRoleFromJWT(String token) {
        Object role = getClaimsFromJWT(token).get("role");
        return role != null ? role.toString().toUpperCase() : "USER";
    }

    /**
     * Extrai todas as Claims validadas do token JWT.
     */
    public Claims getClaimsFromJWT(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Validação rigorosa de assinatura, formato e expiração do Token JWT.
     */
    public boolean validateToken(String authToken) {
        if (!StringUtils.hasText(authToken)) {
            return false;
        }
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.warn("Assinatura JWT inválida ou token malformatado: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.warn("Token JWT expirado: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Token JWT não suportado: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("Claims do JWT vazias ou inválidas: {}", ex.getMessage());
        }
        return false;
    }
}
