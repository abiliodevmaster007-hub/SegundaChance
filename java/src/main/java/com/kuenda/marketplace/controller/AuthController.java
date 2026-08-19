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
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO authRequest) {
        Optional<User> userOpt = userRepository.findByEmail(authRequest.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Credenciais inválidas: utilizador não encontrado.");
        }

        User user = userOpt.get();
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
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Já existe uma conta associada a este endereço de email.");
        }

        User newUser = User.builder()
                .id("u_" + UUID.randomUUID().toString().substring(0, 8))
                .name(registerRequest.getName())
                .email(registerRequest.getEmail())
                .phone(registerRequest.getPhone() != null ? registerRequest.getPhone() : "")
                .location(registerRequest.getLocation() != null ? registerRequest.getLocation() : "Luanda")
                .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")
                .bio("Novo membro no Kuenda Marketplace Angola.")
                .role("USER")
                .rating(5.0)
                .totalSales(0)
                .createdAt(Instant.now().toString())
                .build();

        User savedUser = userRepository.save(newUser);
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        log.info("Novo utilizador registado com sucesso: {}", savedUser.getEmail());

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
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sessão não autenticada.");
        }

        String userId = (String) auth.getPrincipal();
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
