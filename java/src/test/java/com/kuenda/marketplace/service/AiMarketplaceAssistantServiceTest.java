package com.kuenda.marketplace.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.config.SpringAiConfig;
import com.kuenda.marketplace.dto.ai.*;
import com.kuenda.marketplace.model.*;
import com.kuenda.marketplace.repository.ChatRepository;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiMarketplaceAssistantServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private RestClient aiRestClient;

    private SpringAiConfig springAiConfig;
    private AiMarketplaceAssistantService aiService;

    @BeforeEach
    void setUp() {
        springAiConfig = new SpringAiConfig();
        springAiConfig.setConfiguredProvider("HYBRID");
        springAiConfig.setGeminiApiKey("");
        springAiConfig.setGeminiModel("gemini-3.8-flash");
        springAiConfig.setOpenAiApiKey("");
        springAiConfig.setOpenAiModel("gpt-4o-mini");

        aiService = new AiMarketplaceAssistantService(
                listingRepository,
                chatRepository,
                messageRepository,
                springAiConfig,
                aiRestClient,
                new ObjectMapper()
        );
    }

    @Test
    @DisplayName("Deve resolver provedor híbrido dinamicamente conforme chaves de ambiente")
    void shouldResolveHybridProviderCorrectly() {
        assertThat(aiService.resolveActiveProvider()).isEqualTo("SPRING_AI_HYBRID_ENGINE");

        springAiConfig.setGeminiApiKey("AIzaSyTestKey123");
        assertThat(aiService.resolveActiveProvider()).isEqualTo("GEMINI");

        springAiConfig.setConfiguredProvider("OPENAI");
        springAiConfig.setOpenAiApiKey("sk-test-openai-key");
        assertThat(aiService.resolveActiveProvider()).isEqualTo("OPENAI");
    }

    @Test
    @DisplayName("Ferramenta de Precificação em Kwanzas deve identificar preço justo, abaixo e acima do mercado")
    void shouldAnalyzeMarketPriceInKwanzas() {
        Listing l1 = Listing.builder().id("1").title("iPhone 13 Pro").category("tecnologia").price(420000.0).location("Luanda").status(ListingStatus.disponivel).build();
        Listing l2 = Listing.builder().id("2").title("iPhone 13 128GB").category("tecnologia").price(480000.0).location("Luanda").status(ListingStatus.disponivel).build();
        when(listingRepository.findAll()).thenReturn(Arrays.asList(l1, l2));

        AiPriceAnalysisDTO fairCheck = aiService.executePriceAnalysisTool("tecnologia", "Luanda", "excelente", 450000.0, "iPhone 13 Pro");
        assertThat(fairCheck.getVerdict()).isEqualTo("PRECO_JUSTO");
        assertThat(fairCheck.getAvgPriceKz()).isEqualTo(450000.0);
        assertThat(fairCheck.getSafetyTips()).isNotEmpty();

        AiPriceAnalysisDTO highCheck = aiService.executePriceAnalysisTool("tecnologia", "Luanda", "excelente", 620000.0, "iPhone 13 Pro");
        assertThat(highCheck.getVerdict()).isEqualTo("ACIMA_DO_MERCADO");
    }

    @Test
    @DisplayName("Ferramenta de Otimização de Anúncio deve gerar título, descrição estruturada e preço sugerido em Kz")
    void shouldGenerateOptimizedListingDraft() {
        when(listingRepository.findAll()).thenReturn(List.of());

        AiOptimizedListingDraftDTO draft = aiService.executeListingOptimizationTool(
                "MacBook Pro M2 16GB",
                "Com carregador original e caixa, bateria a 96%",
                "tecnologia",
                "excelente",
                "Luanda"
        );

        assertThat(draft.getSuggestedTitle()).contains("MacBook Pro M2 16GB");
        assertThat(draft.getSuggestedDescription()).contains("Multicaixa Express");
        assertThat(draft.getSuggestedPriceKz()).isGreaterThan(0.0);
        assertThat(draft.getSellingTips()).hasSize(3);
    }

    @Test
    @DisplayName("Ferramenta de Diagnóstico do Vendedor deve calcular taxa de conversão e alertas de preço")
    void shouldDiagnoseSellerPortfolio() {
        Listing activeItem = Listing.builder()
                .id("l_1")
                .title("iPhone 14 Pro Max")
                .description("Curta")
                .price(850000.0)
                .category("tecnologia")
                .condition(ListingCondition.excelente)
                .location("Luanda")
                .sellerId("u_antonio")
                .status(ListingStatus.disponivel)
                .createdAt(Instant.now().toString())
                .build();

        Listing soldItem = Listing.builder()
                .id("l_2")
                .title("AirPods Pro")
                .description("Vendido com sucesso em Luanda.")
                .price(120000.0)
                .category("tecnologia")
                .condition(ListingCondition.novo)
                .location("Luanda")
                .sellerId("u_antonio")
                .status(ListingStatus.vendido)
                .createdAt(Instant.now().toString())
                .build();

        when(listingRepository.findBySellerIdOrderByCreatedAtDesc("u_antonio"))
                .thenReturn(Arrays.asList(activeItem, soldItem));
        when(listingRepository.findAll()).thenReturn(Arrays.asList(activeItem, soldItem));

        AiSellerDiagnosticDTO diagnostic = aiService.executeSellerDiagnosticsTool("u_antonio");

        assertThat(diagnostic.getTotalListings()).isEqualTo(2);
        assertThat(diagnostic.getActiveListings()).isEqualTo(1);
        assertThat(diagnostic.getSoldListings()).isEqualTo(1);
        assertThat(diagnostic.getConversionRatePercent()).isEqualTo(50.0);
        assertThat(diagnostic.getActionableInsights()).isNotEmpty();
    }

    @Test
    @DisplayName("Ferramenta de Sugestões de Chat deve adaptar respostas para Comprador e Vendedor")
    void shouldSuggestNegotiationRepliesForBuyerAndSeller() {
        Chat chat = Chat.builder()
                .id("chat_1")
                .listingId("1")
                .listingTitle("iPhone 13 Pro 128GB")
                .listingPrice(450000.0)
                .buyerId("u_maria")
                .sellerId("u_antonio")
                .build();

        when(chatRepository.findById("chat_1")).thenReturn(Optional.of(chat));

        List<String> sellerReplies = aiService.executeChatReplySuggestionsTool("chat_1", "SELLER");
        List<String> buyerReplies = aiService.executeChatReplySuggestionsTool("chat_1", "BUYER");

        assertThat(sellerReplies).hasSize(3);
        assertThat(sellerReplies.get(0)).contains("iPhone 13 Pro 128GB");
        assertThat(buyerReplies).hasSize(3);
        assertThat(buyerReplies.get(1)).contains("Multicaixa Express");
    }
}
