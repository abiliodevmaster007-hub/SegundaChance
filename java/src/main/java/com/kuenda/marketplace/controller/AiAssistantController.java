package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.ai.*;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.AiMarketplaceAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST do Kuenda AI — expõe os endpoints do Assistente Inteligente e
 * as ferramentas determinísticas de servidor para Compradores e Vendedores,
 * com validação estrita de propriedade (sellerId e chatId) a partir do token JWT.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiMarketplaceAssistantService aiAssistantService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAiStatus() {
        String provider = aiAssistantService.resolveActiveProvider();
        String model = aiAssistantService.resolveActiveModel(provider);
        return ResponseEntity.ok(Map.of(
                "status", "ONLINE",
                "provider", provider,
                "model", model,
                "availableTools", List.of(
                        "searchMarketplaceCatalogTool",
                        "analyzeMarketPriceInKwanzasTool",
                        "generateOptimizedListingDraftTool",
                        "diagnoseSellerPortfolioTool",
                        "suggestChatNegotiationRepliesTool"
                )
        ));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiAssistantResponseDTO> chatWithAssistant(@RequestBody AiAssistantRequestDTO request) {
        enforceAuthenticatedSellerScope(request);
        AiAssistantResponseDTO response = aiAssistantService.processChatInteraction(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/optimize-listing")
    public ResponseEntity<AiAssistantResponseDTO> optimizeListing(@RequestBody AiAssistantRequestDTO request) {
        enforceAuthenticatedSellerScope(request);
        request.setRoleContext("SELLER");

        AiOptimizedListingDraftDTO draft = aiAssistantService.executeListingOptimizationTool(
                request.getDraftTitle(),
                request.getDraftNotes(),
                request.getCategory(),
                request.getCondition(),
                request.getLocation()
        );

        AiPriceAnalysisDTO priceAnalysis = aiAssistantService.executePriceAnalysisTool(
                draft.getSuggestedCategory(),
                request.getLocation(),
                draft.getSuggestedCondition(),
                request.getCurrentPriceKz() != null ? request.getCurrentPriceKz() : draft.getSuggestedPriceKz(),
                draft.getSuggestedTitle()
        );

        String provider = aiAssistantService.resolveActiveProvider();
        AiAssistantResponseDTO response = AiAssistantResponseDTO.builder()
                .reply("Otimizei o seu anúncio com base nos preços praticados na província selecionada. Pode aplicar o título, descrição e preço sugerido com um clique.")
                .providerUsed(provider)
                .modelUsed(aiAssistantService.resolveActiveModel(provider))
                .toolsExecuted(List.of("generateOptimizedListingDraftTool", "analyzeMarketPriceInKwanzasTool"))
                .optimizedDraft(draft)
                .priceAnalysis(priceAnalysis)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/price-analysis")
    public ResponseEntity<AiAssistantResponseDTO> analyzePrice(@RequestBody AiAssistantRequestDTO request) {
        enforceAuthenticatedSellerScope(request);
        AiPriceAnalysisDTO analysis = aiAssistantService.executePriceAnalysisTool(
                request.getCategory(),
                request.getLocation(),
                request.getCondition(),
                request.getCurrentPriceKz(),
                request.getDraftTitle() != null ? request.getDraftTitle() : request.getMessage()
        );

        String provider = aiAssistantService.resolveActiveProvider();
        AiAssistantResponseDTO response = AiAssistantResponseDTO.builder()
                .reply(analysis.getExplanation())
                .providerUsed(provider)
                .modelUsed(aiAssistantService.resolveActiveModel(provider))
                .toolsExecuted(List.of("analyzeMarketPriceInKwanzasTool"))
                .priceAnalysis(analysis)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/seller-diagnostics")
    public ResponseEntity<AiAssistantResponseDTO> diagnoseSeller(@RequestBody(required = false) AiAssistantRequestDTO request) {
        AiAssistantRequestDTO req = request != null ? request : new AiAssistantRequestDTO();
        enforceAuthenticatedSellerScope(req);

        AiSellerDiagnosticDTO diagnostic = aiAssistantService.executeSellerDiagnosticsTool(req.getSellerId());
        String provider = aiAssistantService.resolveActiveProvider();

        AiAssistantResponseDTO response = AiAssistantResponseDTO.builder()
                .reply("Diagnóstico completo do seu portfólio de vendas concluído com sucesso.")
                .providerUsed(provider)
                .modelUsed(aiAssistantService.resolveActiveModel(provider))
                .toolsExecuted(List.of("diagnoseSellerPortfolioTool"))
                .sellerDiagnostic(diagnostic)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/seller-diagnostics/{sellerId}")
    public ResponseEntity<AiAssistantResponseDTO> diagnoseSellerById(@PathVariable String sellerId) {
        // Impede que um utilizador consulte o diagnóstico de outro vendedor (HTTP 403 Forbidden)
        SecurityUtils.requireOwnerOrAdmin(sellerId, "o diagnóstico deste vendedor");

        AiSellerDiagnosticDTO diagnostic = aiAssistantService.executeSellerDiagnosticsTool(sellerId);
        String provider = aiAssistantService.resolveActiveProvider();

        AiAssistantResponseDTO response = AiAssistantResponseDTO.builder()
                .reply("Diagnóstico completo do seu portfólio de vendas concluído com sucesso.")
                .providerUsed(provider)
                .modelUsed(aiAssistantService.resolveActiveModel(provider))
                .toolsExecuted(List.of("diagnoseSellerPortfolioTool"))
                .sellerDiagnostic(diagnostic)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat-suggestions")
    public ResponseEntity<AiAssistantResponseDTO> suggestChatReplies(@RequestBody AiAssistantRequestDTO request) {
        enforceAuthenticatedSellerScope(request);
        List<String> replies = aiAssistantService.executeChatReplySuggestionsTool(
                request.getChatId(),
                request.getRoleContext()
        );

        String provider = aiAssistantService.resolveActiveProvider();
        AiAssistantResponseDTO response = AiAssistantResponseDTO.builder()
                .reply("Sugestões de resposta geradas para apoiar a sua negociação.")
                .providerUsed(provider)
                .modelUsed(aiAssistantService.resolveActiveModel(provider))
                .toolsExecuted(List.of("suggestChatNegotiationRepliesTool"))
                .suggestedReplies(replies)
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Garante que o sellerId não seja manipulado pelo cliente no JSON:
     * - Se o cliente enviar um sellerId diferente do seu próprio ID no JWT (e não for ADMIN), lança AccessDeniedException (403).
     * - Caso contrário, fixa o sellerId como o ID do utilizador autenticado no JWT.
     */
    private void enforceAuthenticatedSellerScope(AiAssistantRequestDTO request) {
        SecurityUtils.getCurrentUserIdOpt().ifPresent(currentUserId -> {
            if (StringUtils.hasText(request.getSellerId()) && !request.getSellerId().trim().equals(currentUserId)) {
                SecurityUtils.requireOwnerOrAdmin(request.getSellerId().trim(), "o diagnóstico deste vendedor");
            } else {
                request.setSellerId(currentUserId);
            }
        });
    }
}
