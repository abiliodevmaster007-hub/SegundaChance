package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.AuthRequestDTO;
import com.kuenda.marketplace.dto.AuthResponseDTO;
import com.kuenda.marketplace.dto.RegisterRequestDTO;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO authRequest) {
        String normalizedEmail = authRequest.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            log.warn("Tentativa de login falhada: e-mail não encontrado ({})", normalizedEmail);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciais inválidas: e-mail ou palavra-passe incorretos."));
        }

        User user = userOpt.get();
        if (Boolean.TRUE.equals(user.getBanned())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Esta conta encontra-se suspensa pela administração."));
        }

        if (!StringUtils.hasText(user.getPassword()) ||
                !passwordEncoder.matches(authRequest.getPassword(), user.getPassword())) {
            log.warn("Tentativa de login falhada: palavra-passe incorreta para {}", normalizedEmail);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciais inválidas: e-mail ou palavra-passe incorretos."));
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        log.info("Autenticação bem-sucedida para o utilizador: {} (ID: {})", user.getEmail(), user.getId());

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .user(user)
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO registerRequest) {
        String normalizedEmail = registerRequest.getEmail().trim().toLowerCase();

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Já existe uma conta associada a este endereço de e-mail."));
        }

        String hashedPassword = passwordEncoder.encode(registerRequest.getPassword());

        User newUser = User.builder()
                .id("u_" + UUID.randomUUID().toString().substring(0, 8))
                .name(registerRequest.getName().trim())
                .email(normalizedEmail)
                .password(hashedPassword)
                .phone(StringUtils.hasText(registerRequest.getPhone()) ? registerRequest.getPhone().trim() : "")
                .location(StringUtils.hasText(registerRequest.getLocation()) ? registerRequest.getLocation().trim() : "Luanda")
                .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")
                .bio("Membro verificado na comunidade SegundaChance Angola.")
                .role("USER")
                .rating(5.0)
                .reviewCount(1)
                .totalSales(0)
                .createdAt(Instant.now().toString())
                .build();

        User savedUser = userRepository.save(newUser);
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        log.info("Novo utilizador registado com sucesso: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AuthResponseDTO.builder()
                        .token(token)
                        .tokenType("Bearer")
                        .user(savedUser)
                        .build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sessão não autenticada."));
        }

        String userId = auth.getPrincipal().toString();
        return userRepository.findById(userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Utilizador não encontrado.")));
    }
}
