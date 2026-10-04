package com.kuenda.marketplace.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;

import java.util.Optional;

/**
 * Utilitário centralizado para extração segura do utilizador autenticado a partir do JWT
 * no SecurityContextHolder e validação de propriedade (ownership) de recursos.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * Obtém opcionalmente o ID do utilizador autenticado no contexto atual.
     */
    public static Optional<String> getCurrentUserIdOpt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return Optional.empty();
        }
        String principal = auth.getPrincipal().toString();
        if (!StringUtils.hasText(principal) || "anonymousUser".equals(principal)) {
            return Optional.empty();
        }
        return Optional.of(principal);
    }

    /**
     * Exige que exista um utilizador autenticado no SecurityContextHolder e retorna o seu ID.
     * Lança AuthenticationCredentialsNotFoundException (HTTP 401) caso não esteja autenticado.
     */
    public static String requireCurrentUserId() {
        return getCurrentUserIdOpt()
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException(
                        "Sessão não autenticada. Token JWT válido é obrigatório."
                ));
    }

    /**
     * Verifica se o utilizador autenticado possui a autoridade ROLE_ADMIN.
     */
    public static boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equalsIgnoreCase(authority.getAuthority())
                    || "ADMIN".equalsIgnoreCase(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Exige que o utilizador autenticado possua ROLE_ADMIN (401 se não autenticado, 403 se não for ADMIN).
     */
    public static void requireAdmin(String resourceDescription) {
        requireCurrentUserId();
        if (!isCurrentUserAdmin()) {
            throw new AccessDeniedException(
                    "Acesso negado: apenas administradores da plataforma podem " + resourceDescription + "."
            );
        }
    }

    /**
     * Garante que o utilizador autenticado é o proprietário do recurso (ownerUserId) ou possui ROLE_ADMIN.
     * Caso contrário, lança AccessDeniedException (HTTP 403).
     */
    public static void requireOwnerOrAdmin(String ownerUserId, String resourceDescription) {
        String currentUserId = requireCurrentUserId();
        if (isCurrentUserAdmin()) {
            return;
        }
        if (!StringUtils.hasText(ownerUserId) || !currentUserId.equals(ownerUserId)) {
            throw new AccessDeniedException(
                    "Acesso negado: não tem permissão sobre " + resourceDescription + "."
            );
        }
    }

    /**
     * Garante que o utilizador autenticado é participante da conversa (comprador ou vendedor) ou possui ROLE_ADMIN.
     * Caso contrário, lança AccessDeniedException (HTTP 403).
     */
    public static void requireParticipantOrAdmin(String buyerId, String sellerId, String resourceDescription) {
        String currentUserId = requireCurrentUserId();
        if (isCurrentUserAdmin()) {
            return;
        }
        boolean isBuyer = StringUtils.hasText(buyerId) && currentUserId.equals(buyerId);
        boolean isSeller = StringUtils.hasText(sellerId) && currentUserId.equals(sellerId);
        if (!isBuyer && !isSeller) {
            throw new AccessDeniedException(
                    "Acesso negado: apenas participantes da negociação podem aceder a " + resourceDescription + "."
            );
        }
    }
}
