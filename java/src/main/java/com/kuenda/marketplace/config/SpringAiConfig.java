package com.kuenda.marketplace.config;

import com.kuenda.marketplace.dto.ai.AiOptimizedListingDraftDTO;
import com.kuenda.marketplace.dto.ai.AiPriceAnalysisDTO;
import com.kuenda.marketplace.dto.ai.AiSellerDiagnosticDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.service.AiMarketplaceAssistantService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.function.Function;

/**
 * Configuração Híbrida Multi-Provedor para Spring AI (Google Gemini / OpenAI / Fallback Analítico)
 * e registo de ferramentas de servidor (Function Calling / Tools) sobre o catálogo real em Angola.
 */
@Configuration
@Getter
@Setter
public class SpringAiConfig {

    @Value("${app.ai.provider:HYBRID}")
    private String configuredProvider;

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini.model:gemini-3.8-flash}")
    private String geminiModel;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Bean
    public RestClient aiRestClient() {
        return RestClient.builder().build();
    }

    // =========================================================================
    // REGISTO DE FERRAMENTAS SPRING AI (FUNCTION CALLING BEANS)
    // =========================================================================

    public record CatalogSearchRequest(String query, String category, String location, Double maxPriceKz) {}
    public record PriceEvaluationRequest(String category, String location, String condition, Double priceKz, String title) {}
    public record ListingOptimizationRequest(String draftTitle, String draftNotes, String category, String condition, String location) {}
    public record SellerDiagnosticsRequest(String sellerId) {}
    public record ChatNegotiationRequest(String chatId, String roleContext) {}

    @Bean
    @Description("Pesquisa inteligente no catálogo de anúncios ativos do Kuenda Marketplace em Angola por termo, categoria, província e preço máximo em Kwanzas (Kz)")
    public Function<CatalogSearchRequest, List<Listing>> searchMarketplaceCatalogTool(AiMarketplaceAssistantService aiService) {
        return req -> aiService.executeCatalogSearchTool(req.query(), req.category(), req.location(), req.maxPriceKz());
    }

    @Bean
    @Description("Avalia se o preço em Kwanzas (Kz) de um artigo está abaixo, dentro ou acima da média do mercado angolano e gera dicas de segurança")
    public Function<PriceEvaluationRequest, AiPriceAnalysisDTO> analyzeMarketPriceInKwanzasTool(AiMarketplaceAssistantService aiService) {
        return req -> aiService.executePriceAnalysisTool(req.category(), req.location(), req.condition(), req.priceKz(), req.title());
    }

    @Bean
    @Description("Gera e otimiza automaticamente título comercial, descrição estruturada, categoria ideal e preço sugerido em Kwanzas para vendedores")
    public Function<ListingOptimizationRequest, AiOptimizedListingDraftDTO> generateOptimizedListingDraftTool(AiMarketplaceAssistantService aiService) {
        return req -> aiService.executeListingOptimizationTool(req.draftTitle(), req.draftNotes(), req.category(), req.condition(), req.location());
    }

    @Bean
    @Description("Realiza diagnóstico de performance sobre os anúncios de um vendedor e fornece dicas práticas para vender mais rápido")
    public Function<SellerDiagnosticsRequest, AiSellerDiagnosticDTO> diagnoseSellerPortfolioTool(AiMarketplaceAssistantService aiService) {
        return req -> aiService.executeSellerDiagnosticsTool(req.sellerId());
    }

    @Bean
    @Description("Gera sugestões de respostas cordiais e estratégicas para negociação no chat entre comprador e vendedor")
    public Function<ChatNegotiationRequest, List<String>> suggestChatNegotiationRepliesTool(AiMarketplaceAssistantService aiService) {
        return req -> aiService.executeChatReplySuggestionsTool(req.chatId(), req.roleContext());
    }
}
