package com.kuenda.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.dto.ai.*;
import com.kuenda.marketplace.security.JwtAuthenticationFilter;
import com.kuenda.marketplace.security.JwtTokenProvider;
import com.kuenda.marketplace.service.AiMarketplaceAssistantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiAssistantController.class)
@AutoConfigureMockMvc(addFilters = false)
class AiAssistantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiMarketplaceAssistantService aiAssistantService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/ai/status deve retornar provedor ativo e ferramentas registadas")
    void shouldReturnAiStatus() throws Exception {
        when(aiAssistantService.resolveActiveProvider()).thenReturn("GEMINI");
        when(aiAssistantService.resolveActiveModel("GEMINI")).thenReturn("gemini-3.8-flash");

        mockMvc.perform(get("/api/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ONLINE"))
                .andExpect(jsonPath("$.provider").value("GEMINI"))
                .andExpect(jsonPath("$.availableTools").isArray());
    }

    @Test
    @DisplayName("POST /api/ai/chat deve processar mensagem e retornar resposta enriquecida com tools")
    void shouldProcessChatInteraction() throws Exception {
        AiAssistantResponseDTO mockResponse = AiAssistantResponseDTO.builder()
                .reply("Encontrei 2 ofertas de iPhone em Luanda com preço justo.")
                .providerUsed("GEMINI")
                .modelUsed("gemini-3.8-flash")
                .toolsExecuted(List.of("searchMarketplaceCatalogTool", "analyzeMarketPriceInKwanzasTool"))
                .build();

        when(aiAssistantService.processChatInteraction(any(AiAssistantRequestDTO.class))).thenReturn(mockResponse);

        AiAssistantRequestDTO req = AiAssistantRequestDTO.builder()
                .message("Procuro iPhone 13 em Luanda")
                .roleContext("BUYER")
                .build();

        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerUsed").value("GEMINI"))
                .andExpect(jsonPath("$.toolsExecuted[0]").value("searchMarketplaceCatalogTool"));
    }

    @Test
    @DisplayName("POST /api/ai/optimize-listing deve retornar rascunho otimizado e análise de preço em Kwanzas")
    void shouldOptimizeListingForSeller() throws Exception {
        AiOptimizedListingDraftDTO draft = AiOptimizedListingDraftDTO.builder()
                .suggestedTitle("iPhone 13 Pro 128GB (Como Novo)")
                .suggestedDescription("Descrição completa otimizada")
                .suggestedCategory("tecnologia")
                .suggestedCondition("excelente")
                .suggestedPriceKz(450000.0)
                .build();

        AiPriceAnalysisDTO priceAnalysis = AiPriceAnalysisDTO.builder()
                .verdict("PRECO_JUSTO")
                .avgPriceKz(450000.0)
                .suggestedOptimalPriceKz(450000.0)
                .build();

        when(aiAssistantService.executeListingOptimizationTool(any(), any(), any(), any(), any())).thenReturn(draft);
        when(aiAssistantService.executePriceAnalysisTool(any(), any(), any(), any(), any())).thenReturn(priceAnalysis);
        when(aiAssistantService.resolveActiveProvider()).thenReturn("GEMINI");
        when(aiAssistantService.resolveActiveModel("GEMINI")).thenReturn("gemini-3.8-flash");

        AiAssistantRequestDTO req = AiAssistantRequestDTO.builder()
                .draftTitle("iPhone 13 Pro 128GB")
                .category("tecnologia")
                .condition("excelente")
                .location("Luanda")
                .build();

        mockMvc.perform(post("/api/ai/optimize-listing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.optimizedDraft.suggestedTitle").value("iPhone 13 Pro 128GB (Como Novo)"))
                .andExpect(jsonPath("$.priceAnalysis.verdict").value("PRECO_JUSTO"));
    }

    @Test
    @DisplayName("GET /api/ai/seller-diagnostics/{sellerId} deve retornar 200 OK para o próprio vendedor e 403 Forbidden para outro utilizador")
    void shouldEnforceOwnershipOnSellerDiagnostics() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("u_antonio", null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        AiSellerDiagnosticDTO diag = AiSellerDiagnosticDTO.builder()
                .sellerId("u_antonio")
                .totalListings(2)
                .activeListings(1)
                .soldListings(1)
                .conversionRatePercent(50.0)
                .build();

        when(aiAssistantService.executeSellerDiagnosticsTool("u_antonio")).thenReturn(diag);
        when(aiAssistantService.resolveActiveProvider()).thenReturn("GEMINI");
        when(aiAssistantService.resolveActiveModel("GEMINI")).thenReturn("gemini-3.8-flash");

        // Próprio vendedor -> 200 OK
        mockMvc.perform(get("/api/ai/seller-diagnostics/u_antonio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerDiagnostic.sellerId").value("u_antonio"));

        // Outro vendedor -> 403 Forbidden
        mockMvc.perform(get("/api/ai/seller-diagnostics/u_maria"))
                .andExpect(status().isForbidden());
    }
}
