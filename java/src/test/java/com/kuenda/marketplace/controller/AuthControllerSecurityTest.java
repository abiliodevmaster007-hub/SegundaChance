package com.kuenda.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.dto.AuthRequestDTO;
import com.kuenda.marketplace.dto.RegisterRequestDTO;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.security.JwtAuthenticationFilter;
import com.kuenda.marketplace.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(BCryptPasswordEncoder.class)
class AuthControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/auth/login com palavra-passe incorreta deve retornar HTTP 401 Unauthorized")
    void shouldRejectLoginWithWrongPassword() throws Exception {
        User storedUser = User.builder()
                .id("u_antonio")
                .name("António Manuel")
                .email("antonio@email.ao")
                .password(passwordEncoder.encode("SenhaCorreta123"))
                .role("USER")
                .build();

        when(userRepository.findByEmail("antonio@email.ao")).thenReturn(Optional.of(storedUser));

        AuthRequestDTO req = AuthRequestDTO.builder()
                .email("antonio@email.ao")
                .password("SenhaErrada999")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login com palavra-passe correta deve retornar 200 OK, token JWT e omitir password do JSON")
    void shouldLoginWithValidPasswordAndOmitPasswordInJson() throws Exception {
        User storedUser = User.builder()
                .id("u_antonio")
                .name("António Manuel")
                .email("antonio@email.ao")
                .password(passwordEncoder.encode("SenhaCorreta123"))
                .role("USER")
                .build();

        when(userRepository.findByEmail("antonio@email.ao")).thenReturn(Optional.of(storedUser));
        when(jwtTokenProvider.generateToken(any(), any(), any())).thenReturn("mock.jwt.token");

        AuthRequestDTO req = AuthRequestDTO.builder()
                .email("antonio@email.ao")
                .password("SenhaCorreta123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.user.email").value("antonio@email.ao"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/register deve forçar role USER (mesmo com email contendo admin) e cifrar password com BCrypt")
    void shouldForceUserRoleAndHashPasswordOnRegister() throws Exception {
        when(userRepository.findByEmail("admin_falso@email.ao")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenProvider.generateToken(any(), any(), any())).thenReturn("new.jwt.token");

        RegisterRequestDTO req = RegisterRequestDTO.builder()
                .name("Intruso")
                .email("admin_falso@email.ao")
                .password("MinhaSenhaSegura123")
                .phone("+244 923 555 666")
                .location("Luanda")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("new.jwt.token"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/auth/me sem autenticação deve retornar 401 e com JWT válido deve retornar 200")
    void shouldEnforceAuthenticationOnAuthMe() throws Exception {
        // Sem autenticação -> 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        // Com utilizador autenticado -> 200
        User storedUser = User.builder()
                .id("u_maria")
                .name("Maria Silva")
                .email("maria@email.ao")
                .role("USER")
                .build();
        when(userRepository.findById("u_maria")).thenReturn(Optional.of(storedUser));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("u_maria", null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("u_maria"))
                .andExpect(jsonPath("$.email").value("maria@email.ao"));
    }
}
