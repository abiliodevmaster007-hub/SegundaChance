package com.kuenda.marketplace.config;

import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformAdminSeederTest {

    @Mock
    private UserRepository userRepository;

    private PasswordEncoder passwordEncoder;
    private PlatformAdminSeeder platformAdminSeeder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        platformAdminSeeder = new PlatformAdminSeeder(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(platformAdminSeeder, "enabled", true);
        ReflectionTestUtils.setField(platformAdminSeeder, "adminEmail", "admin@segundachance.ao");
        ReflectionTestUtils.setField(platformAdminSeeder, "adminPassword", "StrongAdminPass2026!");
        ReflectionTestUtils.setField(platformAdminSeeder, "adminName", "Admin Produção");
        ReflectionTestUtils.setField(platformAdminSeeder, "adminPhone", "+244 923 000 000");
        ReflectionTestUtils.setField(platformAdminSeeder, "adminLocation", "Luanda");
    }

    @Test
    @DisplayName("Deve criar um novo administrador com ROLE_ADMIN e password cifrada em BCrypt quando não existir")
    void shouldCreateNewAdminWithBCryptPasswordWhenNotExists() {
        when(userRepository.findByEmail("admin@segundachance.ao")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        platformAdminSeeder.run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());

        User savedAdmin = captor.getValue();
        assertEquals("admin@segundachance.ao", savedAdmin.getEmail());
        assertEquals("ADMIN", savedAdmin.getRole());
        assertEquals("Admin Produção", savedAdmin.getName());
        assertTrue(passwordEncoder.matches("StrongAdminPass2026!", savedAdmin.getPassword()));
        assertNotEquals("StrongAdminPass2026!", savedAdmin.getPassword());
    }

    @Test
    @DisplayName("Deve promover utilizador existente para ADMIN de forma idempotente se já existir no banco")
    void shouldPromoteExistingUserToAdminIdempotently() {
        User existingUser = User.builder()
                .id("u_existing")
                .email("admin@segundachance.ao")
                .name("Utilizador Antigo")
                .role("USER")
                .password(passwordEncoder.encode("OldPassword123"))
                .build();

        when(userRepository.findByEmail("admin@segundachance.ao")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        platformAdminSeeder.run();

        verify(userRepository, times(1)).save(existingUser);
        assertEquals("ADMIN", existingUser.getRole());
        assertTrue(passwordEncoder.matches("StrongAdminPass2026!", existingUser.getPassword()));
    }

    @Test
    @DisplayName("Não deve criar administrador se ADMIN_BOOTSTRAP_EMAIL ou ADMIN_BOOTSTRAP_PASSWORD estiverem vazios")
    void shouldSkipWhenCredentialsAreBlank() {
        ReflectionTestUtils.setField(platformAdminSeeder, "adminPassword", "");

        platformAdminSeeder.run();

        verify(userRepository, never()).findByEmail(any());
        verify(userRepository, never()).save(any());
    }
}
