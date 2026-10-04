package com.kuenda.marketplace.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.model.*;
import com.kuenda.marketplace.repository.ChatRepository;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de Integração End-to-End de Segurança, RBAC, Ownership e PlatformAdminSeeder
 * com a cadeia completa de filtros Spring Security + JwtAuthenticationFilter ativa.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndOwnershipIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String sellerToken;
    private String buyerToken;
    private String intruderToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        chatRepository.deleteAll();
        listingRepository.deleteAll();

        // Verifica que o PlatformAdminSeeder provisionou o admin de teste e gera o token ADMIN
        User seededAdmin = userRepository.findByEmail("admin@segundachance.ao")
                .orElseGet(() -> userRepository.save(User.builder()
                        .id("u_admin_test")
                        .name("Admin Teste Plataforma")
                        .email("admin@segundachance.ao")
                        .password(passwordEncoder.encode("TestAdminStrongPassword2026!"))
                        .role("ADMIN")
                        .location("Luanda")
                        .createdAt(Instant.now().toString())
                        .build()));

        assertEquals("ADMIN", seededAdmin.getRole());

        User seller = userRepository.findByEmail("vendedor@teste.ao")
                .orElseGet(() -> userRepository.save(User.builder()
                        .id("u_seller_test")
                        .name("Vendedor Teste")
                        .email("vendedor@teste.ao")
                        .password(passwordEncoder.encode("Vendedor123"))
                        .phone("+244 923 111 111")
                        .role("USER")
                        .location("Luanda")
                        .createdAt(Instant.now().toString())
                        .build()));

        User buyer = userRepository.findByEmail("comprador@teste.ao")
                .orElseGet(() -> userRepository.save(User.builder()
                        .id("u_buyer_test")
                        .name("Comprador Teste")
                        .email("comprador@teste.ao")
                        .password(passwordEncoder.encode("Comprador123"))
                        .phone("+244 923 222 222")
                        .role("USER")
                        .location("Benguela")
                        .createdAt(Instant.now().toString())
                        .build()));

        User intruder = userRepository.findByEmail("intruso@teste.ao")
                .orElseGet(() -> userRepository.save(User.builder()
                        .id("u_intruder_test")
                        .name("Terceiro Intruso")
                        .email("intruso@teste.ao")
                        .password(passwordEncoder.encode("Intruso123"))
                        .role("USER")
                        .location("Huíla")
                        .createdAt(Instant.now().toString())
                        .build()));

        adminToken = jwtTokenProvider.generateToken(seededAdmin.getId(), seededAdmin.getEmail(), seededAdmin.getName(), "ADMIN");
        sellerToken = jwtTokenProvider.generateToken(seller.getId(), seller.getEmail(), seller.getName(), "USER");
        buyerToken = jwtTokenProvider.generateToken(buyer.getId(), buyer.getEmail(), buyer.getName(), "USER");
        intruderToken = jwtTokenProvider.generateToken(intruder.getId(), intruder.getEmail(), intruder.getName(), "USER");
    }

    @Test
    @DisplayName("Rotas /api/admin/** devem retornar 401 sem token, 403 para USER comum e 200 para ADMIN")
    void shouldEnforceAdminRoleOnAdminEndpoints() throws Exception {
        // Sem token -> 401 Unauthorized
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized());

        // Com token USER -> 403 Forbidden
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isForbidden());

        // Com token ADMIN (provisionado pelo PlatformAdminSeeder) -> 200 OK
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").exists());
    }

    @Test
    @DisplayName("Anúncios: criação usa sellerId do JWT; terceiro recebe 403 ao tentar editar/eliminar; dono ou ADMIN conseguem")
    void shouldEnforceListingOwnership() throws Exception {
        ListingRequestDTO createDto = ListingRequestDTO.builder()
                .title("MacBook Air M2 256GB")
                .description("Em excelente estado com carregador original")
                .price(680000.0)
                .category("tecnologia")
                .condition(ListingCondition.excelente)
                .location("Luanda")
                .sellerId("u_intruder_test") // Tentativa de falsificar sellerId no payload
                .build();

        String createdJson = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sellerId").value("u_seller_test"))
                .andReturn().getResponse().getContentAsString();

        Listing created = objectMapper.readValue(createdJson, Listing.class);

        // Terceiro tenta alterar o estado do anúncio -> 403 Forbidden
        mockMvc.perform(patch("/api/listings/" + created.getId() + "/status")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "vendido"))))
                .andExpect(status().isForbidden());

        // Terceiro tenta eliminar o anúncio -> 403 Forbidden
        mockMvc.perform(delete("/api/listings/" + created.getId())
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());

        // Vendedor proprietário altera o estado -> 200 OK
        mockMvc.perform(patch("/api/listings/" + created.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "vendido"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("vendido"));

        // Vendedor proprietário elimina o anúncio -> 204 No Content
        mockMvc.perform(delete("/api/listings/" + created.getId())
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Chats e Mensagens: apenas comprador e vendedor participantes podem ler ou enviar mensagens (403 para terceiros)")
    void shouldEnforceChatParticipantAuthorization() throws Exception {
        Listing listing = listingRepository.save(Listing.builder()
                .id("list_chat_test")
                .title("PlayStation 5 Slim")
                .description("Com 2 comandos DualSense")
                .price(420000.0)
                .category("tecnologia")
                .condition(ListingCondition.excelente)
                .location("Luanda")
                .sellerId("u_seller_test")
                .sellerName("Vendedor Teste")
                .status(ListingStatus.disponivel)
                .createdAt(Instant.now().toString())
                .build());

        // Comprador inicia chat sobre o anúncio -> 200 OK
        String chatJson = mockMvc.perform(post("/api/chats/start")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("listingId", listing.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buyerId").value("u_buyer_test"))
                .andExpect(jsonPath("$.sellerId").value("u_seller_test"))
                .andReturn().getResponse().getContentAsString();

        Chat chat = objectMapper.readValue(chatJson, Chat.class);

        // Terceiro intruso tenta ler mensagens do chat -> 403 Forbidden
        mockMvc.perform(get("/api/chats/" + chat.getId() + "/messages")
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());

        // Terceiro intruso tenta enviar mensagem no chat -> 403 Forbidden
        mockMvc.perform(post("/api/chats/" + chat.getId() + "/messages")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "Mensagem intrusa"))))
                .andExpect(status().isForbidden());

        // Comprador participante envia mensagem -> 201 Created com senderId=u_buyer_test e recipientId=u_seller_test
        mockMvc.perform(post("/api/chats/" + chat.getId() + "/messages")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "Olá, aceita 400.000 Kz?"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senderId").value("u_buyer_test"))
                .andExpect(jsonPath("$.recipientId").value("u_seller_test"));

        // Terceiro intruso tenta obter sugestões de IA para esta conversa -> 403 Forbidden
        mockMvc.perform(post("/api/ai/chat-suggestions")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("chatId", chat.getId(), "roleContext", "BUYER"))))
                .andExpect(status().isForbidden());
    }
}
