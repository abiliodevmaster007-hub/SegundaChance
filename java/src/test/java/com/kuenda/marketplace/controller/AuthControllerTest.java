package com.kuenda.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.dto.AuthRequestDTO;
import com.kuenda.marketplace.dto.RegisterRequestDTO;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.security.JwtAuthenticationFilter;
import com.kuenda.marketplace.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("POST /api/auth/login com palavra-passe correta deve retornar 200 OK com Token JWT e sem expor password")
    void shouldLoginSuccessfullyWithValidPassword() throws Exception {
        User user = User.builder()
                .id("u_100")
                .name("António Manuel")
                .email("antonio@kuenda.ao")
                .password("$2a$10$hashedPasswordValue")
                .role("USER")
                .build();

        AuthRequestDTO request = AuthRequestDTO.builder()
                .email("antonio@kuenda.ao")
                .password("password123")
                .build();

        when(userRepository.findByEmail("antonio@kuenda.ao")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPasswordValue")).thenReturn(true);
        when(jwtTokenProvider.generateToken(eq("u_100"), eq("antonio@kuenda.ao"), eq("USER")))
                .thenReturn("mocked.jwt.token.here");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token.here"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("antonio@kuenda.ao"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/login com palavra-passe incorreta deve retornar 401 Unauthorized")
    void shouldRejectLoginWithWrongPassword() throws Exception {
        User user = User.builder()
                .id("u_100")
                .name("António Manuel")
                .email("antonio@kuenda.ao")
                .password("$2a$10$hashedPasswordValue")
                .role("USER")
                .build();

        AuthRequestDTO request = AuthRequestDTO.builder()
                .email("antonio@kuenda.ao")
                .password("senhaErrada123")
                .build();

        when(userRepository.findByEmail("antonio@kuenda.ao")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senhaErrada123", "$2a$10$hashedPasswordValue")).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login com utilizador inexistente deve retornar 401 Unauthorized")
    void shouldRejectLoginForNonExistentUser() throws Exception {
        AuthRequestDTO request = AuthRequestDTO.builder()
                .email("inexistente@kuenda.ao")
                .password("password123")
                .build();

        when(userRepository.findByEmail("inexistente@kuenda.ao")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register deve cifrar palavra-passe com BCrypt e retornar 201 Created")
    void shouldRegisterNewUserWithHashedPassword() throws Exception {
        RegisterRequestDTO registerDto = RegisterRequestDTO.builder()
                .name("Novo Utilizador")
                .email("novo@kuenda.ao")
                .password("segredo123")
                .location("Luanda")
                .build();

        when(userRepository.findByEmail("novo@kuenda.ao")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("segredo123")).thenReturn("$2a$10$encodedSegredo123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenProvider.generateToken(any(), eq("novo@kuenda.ao"), eq("USER")))
                .thenReturn("new.user.jwt.token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("new.user.jwt.token"))
                .andExpect(jsonPath("$.user.name").value("Novo Utilizador"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.password").doesNotExist());

        verify(passwordEncoder).encode("segredo123");
    }
}
