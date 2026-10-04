package com.kuenda.marketplace.config;

import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Bootstrap Seeder dedicado e idempotente para o Administrador da Plataforma (ROLE_ADMIN).
 *
 * Ativo em todos os perfis (dev, test, prod) quando app.admin.bootstrap.enabled=true:
 * - Em PROD: lê estritamente ADMIN_BOOTSTRAP_EMAIL e ADMIN_BOOTSTRAP_PASSWORD do ambiente,
 *   garantindo que a conta administrativa inicial exista no PostgreSQL com hash BCrypt
 *   sem carregar dados falsos/demo.
 * - Em TEST / DEV: garante que o administrador de teste/desenvolvimento exista com ROLE_ADMIN.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class PlatformAdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap.enabled:true}")
    private boolean enabled;

    @Value("${app.admin.bootstrap.email:}")
    private String adminEmail;

    @Value("${app.admin.bootstrap.password:}")
    private String adminPassword;

    @Value("${app.admin.bootstrap.name:Administrador SegundaChance}")
    private String adminName;

    @Value("${app.admin.bootstrap.phone:+244 923 000 000}")
    private String adminPhone;

    @Value("${app.admin.bootstrap.location:Luanda}")
    private String adminLocation;

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.debug("PlatformAdminSeeder desativado via configuração (app.admin.bootstrap.enabled=false).");
            return;
        }

        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.info("PlatformAdminSeeder: ADMIN_BOOTSTRAP_EMAIL ou ADMIN_BOOTSTRAP_PASSWORD não definidos; ignorando criação automática de admin.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        String rawPassword = adminPassword.trim();

        if (rawPassword.length() < 6) {
            log.warn("PlatformAdminSeeder: ADMIN_BOOTSTRAP_PASSWORD deve ter pelo menos 6 caracteres. Bootstrap abortado.");
            return;
        }

        seedOrPromoteAdmin(normalizedEmail, rawPassword);
    }

    @Transactional
    public User seedOrPromoteAdmin(String normalizedEmail, String rawPassword) {
        Optional<User> existingOpt = userRepository.findByEmail(normalizedEmail);

        if (existingOpt.isPresent()) {
            User existing = existingOpt.get();
            boolean changed = false;

            if (!"ADMIN".equalsIgnoreCase(existing.getRole())) {
                existing.setRole("ADMIN");
                changed = true;
            }

            if (!StringUtils.hasText(existing.getPassword()) || !passwordEncoder.matches(rawPassword, existing.getPassword())) {
                existing.setPassword(passwordEncoder.encode(rawPassword));
                changed = true;
            }

            if (changed) {
                User saved = userRepository.save(existing);
                log.info("PlatformAdminSeeder: Conta administrativa '{}' sincronizada com ROLE_ADMIN.", normalizedEmail);
                return saved;
            }
            return existing;
        }

        User adminUser = User.builder()
                .id("u_admin_" + UUID.randomUUID().toString().substring(0, 8))
                .name(StringUtils.hasText(adminName) ? adminName.trim() : "Administrador SegundaChance")
                .email(normalizedEmail)
                .password(passwordEncoder.encode(rawPassword))
                .phone(StringUtils.hasText(adminPhone) ? adminPhone.trim() : "+244 923 000 000")
                .location(StringUtils.hasText(adminLocation) ? adminLocation.trim() : "Luanda")
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + normalizedEmail)
                .bio("Administração Oficial SegundaChance Angola")
                .rating(5.0)
                .reviewCount(1)
                .role("ADMIN")
                .createdAt(Instant.now().toString())
                .build();

        User created = userRepository.save(adminUser);
        log.info("PlatformAdminSeeder: Administrador inicial '{}' provisionado com sucesso (ID: {}).", normalizedEmail, created.getId());
        return created;
    }
}
