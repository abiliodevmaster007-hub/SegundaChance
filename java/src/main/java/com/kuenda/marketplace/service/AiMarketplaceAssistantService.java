package com.kuenda.marketplace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.config.SpringAiConfig;
import com.kuenda.marketplace.dto.ai.*;
import com.kuenda.marketplace.model.*;
import com.kuenda.marketplace.repository.ChatRepository;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.text.NumberFormat;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço Central do Assistente Kuenda AI com suporte híbrido Multi-Provedor (Spring AI Gemini / OpenAI)
 * e execução de ferramentas de servidor (Function Calling) para Compradores e Vendedores.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiMarketplaceAssistantService {

    private final ListingRepository listingRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final SpringAiConfig springAiConfig;
    private final RestClient aiRestClient;
    private final ObjectMapper objectMapper;

    // Referências de preços médios de mercado em Angola (em Kwanzas - Kz) por categoria quando amostra é reduzida
    private static final Map<String, Double> BASELINE_CATEGORY_PRICES_KZ = Map.of(
            "tecnologia", 320000.0,
            "veiculos", 12500000.0,
            "casa", 145000.0,
            "moda", 42000.0,
            "desporto", 65000.0,
            "outros", 50000.0
    );

    /**
     * Resolve qual provedor de IA está ativo segundo a configuração híbrida via variáveis de ambiente.
     */
    public String resolveActiveProvider() {
        String configured = springAiConfig.getConfiguredProvider() != null
                ? springAiConfig.getConfiguredProvider().trim().toUpperCase()
                : "HYBRID";

        boolean hasGemini = springAiConfig.getGeminiApiKey() != null
                && !springAiConfig.getGeminiApiKey().isBlank()
                && !"MY_GEMINI_API_KEY".equals(springAiConfig.getGeminiApiKey());
        boolean hasOpenAi = springAiConfig.getOpenAiApiKey() != null
                && !springAiConfig.getOpenAiApiKey().isBlank()
                && !"MY_OPENAI_API_KEY".equals(springAiConfig.getOpenAiApiKey());

        if ("OPENAI".equals(configured) && hasOpenAi) {
            return "OPENAI";
        }
        if ("GEMINI".equals(configured) && hasGemini) {
            return "GEMINI";
        }
        if (hasGemini) {
            return "GEMINI";
        }
        if (hasOpenAi) {
            return "OPENAI";
        }
        return "SPRING_AI_HYBRID_ENGINE";
    }

    public String resolveActiveModel(String provider) {
        if ("GEMINI".equals(provider)) {
            return springAiConfig.getGeminiModel();
        }
        if ("OPENAI".equals(provider)) {
            return springAiConfig.getOpenAiModel();
        }
        return "kuenda-market-intelligence-v1";
    }

    // =========================================================================
    // 1. FERRAMENTA DE BUSCA INTELIGENTE E COMPARAÇÃO NO CATÁLOGO (COMPRADOR)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<Listing> executeCatalogSearchTool(String query, String category, String location, Double maxPriceKz) {
        List<Listing> activeListings = listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.disponivel);

        return activeListings.stream()
                .filter(l -> {
                    if (category != null && !category.isBlank() && !"todos".equalsIgnoreCase(category)) {
                        return category.equalsIgnoreCase(l.getCategory());
                    }
                    return true;
                })
                .filter(l -> {
                    if (location != null && !location.isBlank() && !"todos".equalsIgnoreCase(location) && !"todas".equalsIgnoreCase(location)) {
                        return l.getLocation() != null && l.getLocation().toLowerCase().contains(location.toLowerCase());
                    }
                    return true;
                })
                .filter(l -> {
                    if (maxPriceKz != null && maxPriceKz > 0) {
                        return l.getPrice() != null && l.getPrice() <= maxPriceKz;
                    }
                    return true;
                })
                .filter(l -> {
                    if (query != null && !query.isBlank()) {
                        String[] tokens = query.toLowerCase().split("\\s+");
                        String fullText = ((l.getTitle() != null ? l.getTitle() : "") + " "
                                + (l.getDescription() != null ? l.getDescription() : "") + " "
                                + (l.getCategory() != null ? l.getCategory() : "") + " "
                                + (l.getLocation() != null ? l.getLocation() : "")).toLowerCase();
                        for (String token : tokens) {
                            if (token.length() > 2 && fullText.contains(token)) {
                                return true;
                            }
                        }
                        return false;
                    }
                    return true;
                })
                .limit(6)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 2. FERRAMENTA DE PRECIFICAÇÃO EM KWANZAS E SEGURANÇA (VENDEDOR & COMPRADOR)
    // =========================================================================
    @Transactional(readOnly = true)
    public AiPriceAnalysisDTO executePriceAnalysisTool(
            String category,
            String location,
            String condition,
            Double targetPriceKz,
            String title
    ) {
        String normalizedCategory = (category != null && !category.isBlank()) ? category.toLowerCase().trim() : inferCategoryFromText(title);
        String normalizedLocation = (location != null && !location.isBlank()) ? location.trim() : "Luanda";
        String normalizedCondition = (condition != null && !condition.isBlank()) ? condition.toLowerCase().trim() : "excelente";

        List<Listing> comparableListings = listingRepository.findAll().stream()
                .filter(l -> l.getCategory() != null && l.getCategory().equalsIgnoreCase(normalizedCategory))
                .filter(l -> l.getPrice() != null && l.getPrice() > 0)
                .collect(Collectors.toList());

        double minPrice;
        double maxPrice;
        double avgPrice;
        int sampleSize = comparableListings.size();

        if (!comparableListings.isEmpty()) {
            DoubleSummaryStatistics stats = comparableListings.stream()
                    .mapToDouble(Listing::getPrice)
                    .summaryStatistics();
            minPrice = stats.getMin();
            maxPrice = stats.getMax();
            avgPrice = Math.round(stats.getAverage());
            if (minPrice == maxPrice) {
                minPrice = Math.round(avgPrice * 0.80);
                maxPrice = Math.round(avgPrice * 1.25);
            }
        } else {
            avgPrice = BASELINE_CATEGORY_PRICES_KZ.getOrDefault(normalizedCategory, 85000.0);
            minPrice = Math.round(avgPrice * 0.70);
            maxPrice = Math.round(avgPrice * 1.35);
        }

        // Ajuste por condição do artigo
        double conditionMultiplier = switch (normalizedCondition) {
            case "novo" -> 1.12;
            case "excelente" -> 1.0;
            case "bom_estado" -> 0.85;
            default -> 0.72;
        };

        double suggestedOptimal = Math.round((avgPrice * conditionMultiplier) / 500.0) * 500.0;
        double evaluatedPrice = (targetPriceKz != null && targetPriceKz > 0) ? targetPriceKz : suggestedOptimal;
        double diffPercentage = Math.round(((evaluatedPrice - suggestedOptimal) / suggestedOptimal) * 1000.0) / 10.0;

        String verdict;
        String explanation;
        if (diffPercentage <= -12.0) {
            verdict = "ABAIXO_DO_MERCADO";
            explanation = String.format(
                    "O valor de %s Kz está %.1f%% abaixo da média estimada para '%s' em %s (%s Kz). Excelente oportunidade de compra rápida, mas convém testar o artigo presencialmente.",
                    formatKz(evaluatedPrice), Math.abs(diffPercentage), normalizedCategory, normalizedLocation, formatKz(suggestedOptimal)
            );
        } else if (diffPercentage >= 15.0) {
            verdict = "ACIMA_DO_MERCADO";
            explanation = String.format(
                    "O valor de %s Kz está %.1f%% acima da referência para '%s' em estado '%s' (%s Kz). Há margem para negociar um desconto ou ajustar para vender mais rápido.",
                    formatKz(evaluatedPrice), diffPercentage, normalizedCategory, normalizedCondition, formatKz(suggestedOptimal)
            );
        } else {
            verdict = "PRECO_JUSTO";
            explanation = String.format(
                    "O valor de %s Kz está alinhado com o mercado em %s (referência ótima: %s Kz com base em %d anúncio(s) da categoria).",
                    formatKz(evaluatedPrice), normalizedLocation, formatKz(suggestedOptimal), Math.max(1, sampleSize)
            );
        }

        List<String> safetyTips = List.of(
                "Marque o encontro num local público e movimentado em " + normalizedLocation + " (ex: centro comercial, esquadra próxima ou agência bancária).",
                "Inspecione o funcionamento completo do artigo antes de efetuar transferência por Multicaixa Express ou entrega em numerário.",
                "Desconfie de pedidos de sinal adiantado ou comprovativos bancários em PDF sem confirmação de saldo na conta."
        );

        return AiPriceAnalysisDTO.builder()
                .category(normalizedCategory)
                .location(normalizedLocation)
                .condition(normalizedCondition)
                .targetPriceKz(evaluatedPrice)
                .minPriceKz(minPrice)
                .avgPriceKz(avgPrice)
                .maxPriceKz(maxPrice)
                .suggestedOptimalPriceKz(suggestedOptimal)
                .verdict(verdict)
                .diffPercentage(diffPercentage)
                .sampleSize(sampleSize)
                .explanation(explanation)
                .safetyTips(safetyTips)
                .build();
    }

    // =========================================================================
    // 3. FERRAMENTA DE GERAÇÃO E OTIMIZAÇÃO DE ANÚNCIOS (VENDEDOR)
    // =========================================================================
    @Transactional(readOnly = true)
    public AiOptimizedListingDraftDTO executeListingOptimizationTool(
            String draftTitle,
            String draftNotes,
            String category,
            String condition,
            String location
    ) {
        String rawInput = ((draftTitle != null ? draftTitle : "") + " " + (draftNotes != null ? draftNotes : "")).trim();
        String resolvedCategory = (category != null && !category.isBlank())
                ? category.toLowerCase().trim()
                : inferCategoryFromText(rawInput);
        String resolvedCondition = (condition != null && !condition.isBlank()) ? condition : "excelente";
        String resolvedLocation = (location != null && !location.isBlank()) ? location : "Luanda";

        String cleanBaseTitle = (draftTitle != null && !draftTitle.isBlank())
                ? draftTitle.trim()
                : "Artigo Premium em Excelente Estado";

        String conditionBadge = switch (resolvedCondition) {
            case "novo" -> "Novo na Caixa";
            case "excelente" -> "Como Novo";
            case "bom_estado" -> "Bom Estado";
            default -> "Pronto a Usar";
        };

        String suggestedTitle = cleanBaseTitle.length() > 42
                ? cleanBaseTitle.substring(0, 42).trim() + " — " + conditionBadge
                : cleanBaseTitle + " (" + conditionBadge + ")";
        if (suggestedTitle.length() > 60) {
            suggestedTitle = suggestedTitle.substring(0, 60).trim();
        }

        AiPriceAnalysisDTO priceRef = executePriceAnalysisTool(
                resolvedCategory,
                resolvedLocation,
                resolvedCondition,
                null,
                cleanBaseTitle
        );

        String extraDetails = (draftNotes != null && !draftNotes.isBlank())
                ? draftNotes.trim()
                : "Artigo muito bem estimado, testado a 100% e sem defeitos ocultos.";

        String suggestedDescription = String.format(
                "%s disponível para entrega imediata em %s.\n\n" +
                "• Estado de conservação: %s\n" +
                "• Detalhes adicionais: %s\n" +
                "• Verificação: Pode testar pessoalmente no ato da entrega em local público seguro.\n" +
                "• Pagamento aceite: Multicaixa Express, transferência imediata no local ou numerário.\n\n" +
                "Envie mensagem pelo chat do Kuenda para agendar visita ou esclarecer dúvidas!",
                cleanBaseTitle,
                resolvedLocation,
                conditionBadge,
                extraDetails
        );

        return AiOptimizedListingDraftDTO.builder()
                .suggestedTitle(suggestedTitle)
                .suggestedDescription(suggestedDescription)
                .suggestedCategory(resolvedCategory)
                .suggestedCondition(resolvedCondition)
                .suggestedPriceKz(priceRef.getSuggestedOptimalPriceKz())
                .highlightTags(List.of("Verificação Presencial", "Multicaixa Express", resolvedLocation))
                .sellingTips(List.of(
                        "Anúncios com fotografias reais bem iluminadas vendem até 2,4x mais rápido em " + resolvedLocation + ".",
                        "Mantenha o preço inicial próximo de " + formatKz(priceRef.getSuggestedOptimalPriceKz()) + " Kz com margem de 5% a 10% para negociação no chat.",
                        "Responda às mensagens nas primeiras 2 horas para destacar o seu perfil de vendedor."
                ))
                .build();
    }

    // =========================================================================
    // 4. FERRAMENTA DE DIAGNÓSTICO DE PERFORMANCE DO VENDEDOR (VENDEDOR)
    // =========================================================================
    @Transactional(readOnly = true)
    public AiSellerDiagnosticDTO executeSellerDiagnosticsTool(String sellerId) {
        String targetSellerId = (sellerId != null && !sellerId.isBlank())
                ? sellerId.trim()
                : com.kuenda.marketplace.security.SecurityUtils.getCurrentUserIdOpt().orElse(null);

        if (targetSellerId != null && com.kuenda.marketplace.security.SecurityUtils.getCurrentUserIdOpt().isPresent()) {
            com.kuenda.marketplace.security.SecurityUtils.requireOwnerOrAdmin(targetSellerId, "o diagnóstico deste vendedor");
        }

        List<Listing> sellerListings = (targetSellerId != null && !targetSellerId.isBlank())
                ? listingRepository.findBySellerIdOrderByCreatedAtDesc(targetSellerId)
                : Collections.emptyList();

        int total = sellerListings.size();
        int sold = (int) sellerListings.stream().filter(l -> l.getStatus() == ListingStatus.vendido).count();
        int active = total - sold;
        double conversionRate = total > 0 ? Math.round((sold * 1000.0) / total) / 10.0 : 0.0;

        double activeValue = sellerListings.stream()
                .filter(l -> l.getStatus() == ListingStatus.disponivel && l.getPrice() != null)
                .mapToDouble(Listing::getPrice)
                .sum();

        double soldRevenue = sellerListings.stream()
                .filter(l -> l.getStatus() == ListingStatus.vendido && l.getPrice() != null)
                .mapToDouble(Listing::getPrice)
                .sum();

        List<String> insights = new ArrayList<>();
        List<String> pricingAlerts = new ArrayList<>();

        if (total == 0) {
            insights.add("Ainda não possui anúncios ativos. Publique o seu primeiro artigo usando o Otimizador de IA para atrair compradores em Luanda e outras províncias.");
        } else {
            for (Listing item : sellerListings) {
                if (item.getStatus() == ListingStatus.disponivel) {
                    if (item.getDescription() == null || item.getDescription().length() < 55) {
                        insights.add("O anúncio '" + item.getTitle() + "' tem uma descrição curta. Adicione detalhes sobre tempo de uso, acessórios e local de entrega.");
                    }
                    AiPriceAnalysisDTO analysis = executePriceAnalysisTool(
                            item.getCategory(),
                            item.getLocation(),
                            item.getCondition() != null ? item.getCondition().name() : "excelente",
                            item.getPrice(),
                            item.getTitle()
                    );
                    if ("ACIMA_DO_MERCADO".equals(analysis.getVerdict())) {
                        pricingAlerts.add(String.format(
                                "'%s' (%s Kz) está %.1f%% acima da média da categoria. Considere ajustar para cerca de %s Kz.",
                                item.getTitle(),
                                formatKz(item.getPrice()),
                                analysis.getDiffPercentage(),
                                formatKz(analysis.getSuggestedOptimalPriceKz())
                        ));
                    } else if ("ABAIXO_DO_MERCADO".equals(analysis.getVerdict())) {
                        pricingAlerts.add(String.format(
                                "'%s' (%s Kz) está muito competitivo e com elevado potencial de fecho imediato.",
                                item.getTitle(),
                                formatKz(item.getPrice())
                        ));
                    }
                }
            }
            if (insights.isEmpty()) {
                insights.add("Todos os seus anúncios ativos possuem descrições completas e estruturadas.");
            }
            insights.add("Dica de conversão: Partilhe disponibilidade para entrega em pontos centrais (ex: Talatona, Maianga, Kilamba ou centro da sua província).");
        }

        String health = (total > 0 && pricingAlerts.size() <= 1 && conversionRate >= 25.0)
                ? "EXCELENTE"
                : (total > 0 ? "BOM" : "PRECISA_ATENCAO");

        return AiSellerDiagnosticDTO.builder()
                .sellerId(targetSellerId != null ? targetSellerId : "vendedor_atual")
                .totalListings(total)
                .activeListings(active)
                .soldListings(sold)
                .conversionRatePercent(conversionRate)
                .totalActiveValueKz(activeValue)
                .totalSoldRevenueKz(soldRevenue)
                .overallHealth(health)
                .actionableInsights(insights)
                .pricingAlerts(pricingAlerts)
                .build();
    }

    // =========================================================================
    // 5. FERRAMENTA DE SUGESTÃO DE RESPOSTAS NO CHAT (COMPRADOR & VENDEDOR)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<String> executeChatReplySuggestionsTool(String chatId, String roleContext) {
        boolean isSeller = "SELLER".equalsIgnoreCase(roleContext);

        if (chatId != null && !chatId.isBlank()) {
            Optional<Chat> chatOpt = chatRepository.findById(chatId.trim());
            if (chatOpt.isPresent()) {
                Chat chat = chatOpt.get();

                // Impede que terceiros acedam às sugestões de negociação de um chat alheio (HTTP 403)
                Optional<String> currentUserOpt = com.kuenda.marketplace.security.SecurityUtils.getCurrentUserIdOpt();
                if (currentUserOpt.isPresent()) {
                    com.kuenda.marketplace.security.SecurityUtils.requireParticipantOrAdmin(
                            chat.getBuyerId(),
                            chat.getSellerId(),
                            "as sugestões desta conversa"
                    );
                    String currentUserId = currentUserOpt.get();
                    if (currentUserId.equals(chat.getSellerId())) {
                        isSeller = true;
                    } else if (currentUserId.equals(chat.getBuyerId())) {
                        isSeller = false;
                    }
                }

                String title = chat.getListingTitle() != null ? chat.getListingTitle() : "o artigo";
                double price = chat.getListingPrice() != null ? chat.getListingPrice() : 0.0;
                double counterOffer = Math.round((price * 0.90) / 500.0) * 500.0;

                if (isSeller) {
                    return List.of(
                            String.format("Olá! Sim, o %s ainda está disponível e em excelente estado. Podemos agendar para ver pessoalmente?", title),
                            price > 0
                                    ? String.format("Consigo fazer um preço especial de %s Kz para fecharmos negócio hoje com pagamento via Multicaixa Express.", formatKz(counterOffer))
                                    : "Posso fazer uma pequena atenção no valor se combinarmos a recolha ainda hoje num local público seguro.",
                            "Perfeito! Podemos encontrar-nos num shopping ou ponto público movimentado para testar o artigo com total tranquilidade."
                    );
                } else {
                    return List.of(
                            String.format("Olá! Tenho interesse no %s. Ainda está disponível e funciona a 100%%?", title),
                            price > 0
                                    ? String.format("Aceita %s Kz com pagamento imediato via Multicaixa Express após testarmos presencialmente?", formatKz(counterOffer))
                                    : "Qual é o valor mínimo que consegue fazer para fecharmos negócio hoje?",
                            "Em que zona podemos encontrar-nos num local público seguro para eu ver o artigo?"
                    );
                }
            }
        }

        if (isSeller) {
            return List.of(
                    "Olá! O artigo continua disponível e pronto para teste presencial. Quando lhe dá jeito ver?",
                    "Consigo fazer um desconto de 5% se fecharmos negócio hoje via Multicaixa Express.",
                    "Podemos combinar a entrega num centro comercial ou local público seguro para ambos."
            );
        }
        return List.of(
                "Olá! Ainda tem este artigo disponível para entrega imediata?",
                "O preço é negociável se fecharmos negócio ainda hoje?",
                "Podemos combinar num local público seguro para eu testar o artigo antes do pagamento?"
        );
    }

    // =========================================================================
    // ORQUESTRADOR CONVERSACIONAL COM TOOL CALLING E SUPORTE MULTI-PROVEDOR
    // =========================================================================
    @Transactional(readOnly = true)
    public AiAssistantResponseDTO processChatInteraction(AiAssistantRequestDTO request) {
        String provider = resolveActiveProvider();
        String model = resolveActiveModel(provider);
        String roleContext = request.getRoleContext() != null ? request.getRoleContext().toUpperCase() : "GENERAL";
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        String lowerMsg = userMessage.toLowerCase();

        List<String> toolsExecuted = new ArrayList<>();
        AiPriceAnalysisDTO priceAnalysis = null;
        AiOptimizedListingDraftDTO optimizedDraft = null;
        AiSellerDiagnosticDTO sellerDiagnostic = null;
        List<Listing> recommendedListings = null;
        List<String> suggestedReplies = null;

        // 1. Resolução Contextual Automática de Ferramentas do Servidor (Function Calling)
        if (request.getListingId() != null && !request.getListingId().isBlank()) {
            Optional<Listing> targetOpt = listingRepository.findById(request.getListingId());
            if (targetOpt.isPresent()) {
                Listing target = targetOpt.get();
                toolsExecuted.add("analyzeMarketPriceInKwanzasTool");
                priceAnalysis = executePriceAnalysisTool(
                        target.getCategory(),
                        target.getLocation(),
                        target.getCondition() != null ? target.getCondition().name() : "excelente",
                        target.getPrice(),
                        target.getTitle()
                );
            }
        } else if (lowerMsg.contains("preço") || lowerMsg.contains("preco") || lowerMsg.contains("quanto")
                || lowerMsg.contains("vale") || lowerMsg.contains("avaliar") || lowerMsg.contains("justo")
                || (request.getCurrentPriceKz() != null && request.getCurrentPriceKz() > 0)) {
            toolsExecuted.add("analyzeMarketPriceInKwanzasTool");
            priceAnalysis = executePriceAnalysisTool(
                    request.getCategory(),
                    request.getLocation(),
                    request.getCondition(),
                    request.getCurrentPriceKz(),
                    userMessage
            );
        }

        if ("SELLER".equals(roleContext) && (lowerMsg.contains("criar") || lowerMsg.contains("otimizar")
                || lowerMsg.contains("gerar") || lowerMsg.contains("anúncio") || lowerMsg.contains("anuncio")
                || lowerMsg.contains("título") || lowerMsg.contains("descrição") || request.getDraftTitle() != null)) {
            toolsExecuted.add("generateOptimizedListingDraftTool");
            optimizedDraft = executeListingOptimizationTool(
                    request.getDraftTitle() != null ? request.getDraftTitle() : userMessage,
                    request.getDraftNotes() != null ? request.getDraftNotes() : userMessage,
                    request.getCategory(),
                    request.getCondition(),
                    request.getLocation()
            );
        }

        if ("SELLER".equals(roleContext) && (lowerMsg.contains("diagnóstico") || lowerMsg.contains("diagnostico")
                || lowerMsg.contains("desempenho") || lowerMsg.contains("performance") || lowerMsg.contains("vender mais")
                || lowerMsg.contains("meus anúncios") || lowerMsg.contains("portfólio"))) {
            toolsExecuted.add("diagnoseSellerPortfolioTool");
            sellerDiagnostic = executeSellerDiagnosticsTool(request.getSellerId());
        }

        if (request.getChatId() != null || lowerMsg.contains("responder") || lowerMsg.contains("negociar")
                || lowerMsg.contains("mensagem") || lowerMsg.contains("contraproposta")) {
            toolsExecuted.add("suggestChatNegotiationRepliesTool");
            suggestedReplies = executeChatReplySuggestionsTool(request.getChatId(), roleContext);
        }

        if ("BUYER".equals(roleContext) || lowerMsg.contains("procur") || lowerMsg.contains("comprar")
                || lowerMsg.contains("encontrar") || lowerMsg.contains("comparar") || lowerMsg.contains("oferta")
                || lowerMsg.contains("iphone") || lowerMsg.contains("carro") || lowerMsg.contains("sofá")
                || lowerMsg.contains("tenis") || lowerMsg.contains("ténis") || toolsExecuted.isEmpty()) {
            toolsExecuted.add("searchMarketplaceCatalogTool");
            recommendedListings = executeCatalogSearchTool(
                    extractSearchKeywords(userMessage),
                    request.getCategory(),
                    request.getLocation(),
                    request.getCurrentPriceKz()
            );
            if (recommendedListings.isEmpty()) {
                recommendedListings = listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.disponivel)
                        .stream().limit(4).collect(Collectors.toList());
            }
        }

        // 2. Construção da Resposta (via Provedor Externo Gemini / OpenAI se chave ativa, ou Motor Analítico Spring AI)
        String reply = generateContextualReply(
                provider,
                userMessage,
                roleContext,
                priceAnalysis,
                optimizedDraft,
                sellerDiagnostic,
                recommendedListings,
                suggestedReplies
        );

        return AiAssistantResponseDTO.builder()
                .reply(reply)
                .providerUsed(provider)
                .modelUsed(model)
                .toolsExecuted(toolsExecuted)
                .priceAnalysis(priceAnalysis)
                .optimizedDraft(optimizedDraft)
                .sellerDiagnostic(sellerDiagnostic)
                .recommendedListings(recommendedListings)
                .suggestedReplies(suggestedReplies)
                .timestamp(Instant.now().toString())
                .build();
    }

    private String generateContextualReply(
            String provider,
            String userMessage,
            String roleContext,
            AiPriceAnalysisDTO priceAnalysis,
            AiOptimizedListingDraftDTO optimizedDraft,
            AiSellerDiagnosticDTO sellerDiagnostic,
            List<Listing> recommendedListings,
            List<String> suggestedReplies
    ) {
        StringBuilder contextSummary = new StringBuilder();
        if (priceAnalysis != null) {
            contextSummary.append("\n[Análise de Preço (Kz)]: ").append(priceAnalysis.getExplanation())
                    .append(" (Mín: ").append(formatKz(priceAnalysis.getMinPriceKz()))
                    .append(" Kz | Média: ").append(formatKz(priceAnalysis.getAvgPriceKz()))
                    .append(" Kz | Máx: ").append(formatKz(priceAnalysis.getMaxPriceKz())).append(" Kz).");
        }
        if (optimizedDraft != null) {
            contextSummary.append("\n[Rascunho Otimizado]: Título sugerido: '").append(optimizedDraft.getSuggestedTitle())
                    .append("', Preço sugerido: ").append(formatKz(optimizedDraft.getSuggestedPriceKz())).append(" Kz.");
        }
        if (sellerDiagnostic != null) {
            contextSummary.append("\n[Diagnóstico do Vendedor]: ").append(sellerDiagnostic.getActiveListings())
                    .append(" ativos, ").append(sellerDiagnostic.getSoldListings())
                    .append(" vendidos (Conversão: ").append(sellerDiagnostic.getConversionRatePercent()).append("%).");
        }
        if (recommendedListings != null && !recommendedListings.isEmpty()) {
            contextSummary.append("\n[Catálogo Vivo]: Encontrados ").append(recommendedListings.size()).append(" anúncios relevantes: ");
            recommendedListings.forEach(l -> contextSummary.append(l.getTitle()).append(" (").append(formatKz(l.getPrice())).append(" Kz em ").append(l.getLocation()).append("); "));
        }

        // Tenta chamar a API real do Gemini ou OpenAI se configurada
        try {
            if ("GEMINI".equals(provider)) {
                String llmText = callGeminiApi(userMessage, roleContext, contextSummary.toString());
                if (llmText != null && !llmText.isBlank()) {
                    return llmText;
                }
            } else if ("OPENAI".equals(provider)) {
                String llmText = callOpenAiApi(userMessage, roleContext, contextSummary.toString());
                if (llmText != null && !llmText.isBlank()) {
                    return llmText;
                }
            }
        } catch (Exception e) {
            log.warn("Fallback acionado para o motor analítico local do Spring AI: {}", e.getMessage());
        }

        // Resposta estruturada de alta precisão com base nos dados reais das ferramentas executadas
        StringBuilder fallback = new StringBuilder();
        if ("SELLER".equalsIgnoreCase(roleContext)) {
            fallback.append("Analisei os dados reais do Kuenda Marketplace para apoiar as suas vendas:\n\n");
        } else {
            fallback.append("Consultei o catálogo e as métricas do mercado angolano em tempo real para si:\n\n");
        }

        if (priceAnalysis != null) {
            fallback.append("• Avaliação de Preço em Kwanzas: ").append(priceAnalysis.getExplanation()).append("\n");
            fallback.append("• Faixa praticada na categoria: Mínimo ").append(formatKz(priceAnalysis.getMinPriceKz()))
                    .append(" Kz · Média ").append(formatKz(priceAnalysis.getAvgPriceKz()))
                    .append(" Kz · Teto ").append(formatKz(priceAnalysis.getMaxPriceKz())).append(" Kz.\n\n");
        }

        if (optimizedDraft != null) {
            fallback.append("• Anúncio Otimizado Gerado: Preparei o título \"").append(optimizedDraft.getSuggestedTitle())
                    .append("\" com preço competitivo recomendado de ").append(formatKz(optimizedDraft.getSuggestedPriceKz()))
                    .append(" Kz. Pode aplicar este modelo com um clique.\n\n");
        }

        if (sellerDiagnostic != null) {
            fallback.append("• Diagnóstico da sua Conta: Possui ").append(sellerDiagnostic.getActiveListings())
                    .append(" anúncio(s) ativo(s) totalizando ").append(formatKz(sellerDiagnostic.getTotalActiveValueKz()))
                    .append(" Kz e taxa de conversão de ").append(sellerDiagnostic.getConversionRatePercent()).append("%.\n");
            if (!sellerDiagnostic.getActionableInsights().isEmpty()) {
                fallback.append("• Recomendação Prioritária: ").append(sellerDiagnostic.getActionableInsights().get(0)).append("\n\n");
            }
        }

        if (recommendedListings != null && !recommendedListings.isEmpty()) {
            fallback.append("• Ofertas Encontradas no Catálogo: Seleccionei ").append(recommendedListings.size())
                    .append(" anúncio(s) compatíveis abaixo para comparar preço, estado e localização.\n");
        }

        if (suggestedReplies != null && !suggestedReplies.isEmpty()) {
            fallback.append("• Sugestões de Negociação: Criei 3 respostas prontas para usar diretamente no chat.");
        }

        return fallback.toString().trim();
    }

    private String callGeminiApi(String userMessage, String roleContext, String toolContext) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + springAiConfig.getGeminiModel()
                + ":generateContent?key=" + springAiConfig.getGeminiApiKey();

        String systemPrompt = "Você é o Kuenda AI, o assistente oficial do Kuenda Marketplace em Angola. "
                + "Atue como um consultor especialista para " + ("SELLER".equals(roleContext) ? "VENDEDORES" : "COMPRADORES") + ". "
                + "Use sempre a moeda Kwanza (Kz), referências reais às províncias de Angola (Luanda, Benguela, Huambo, Huíla, etc.) "
                + "e recomendações de segurança presencial e Multicaixa Express. "
                + "Dados extraídos das ferramentas do servidor em tempo real: " + toolContext;

        Map<String, Object> body = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userMessage))))
        );

        String responseJson = aiRestClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseJson);
        return root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
    }

    private String callOpenAiApi(String userMessage, String roleContext, String toolContext) throws Exception {
        String url = springAiConfig.getOpenAiBaseUrl() + "/chat/completions";
        String systemPrompt = "Você é o Kuenda AI, o assistente oficial do Kuenda Marketplace em Angola para "
                + ("SELLER".equals(roleContext) ? "VENDEDORES" : "COMPRADORES") + ". "
                + "Use sempre Kwanzas (Kz) e os dados reais das ferramentas do servidor: " + toolContext;

        Map<String, Object> body = Map.of(
                "model", springAiConfig.getOpenAiModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                )
        );

        String responseJson = aiRestClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + springAiConfig.getOpenAiApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseJson);
        return root.path("choices").path(0).path("message").path("content").asText(null);
    }

    private String inferCategoryFromText(String text) {
        if (text == null || text.isBlank()) return "tecnologia";
        String lower = text.toLowerCase();
        if (lower.contains("carro") || lower.contains("viatura") || lower.contains("toyota")
                || lower.contains("mota") || lower.contains("prado") || lower.contains("hyundai")) {
            return "veiculos";
        }
        if (lower.contains("sofá") || lower.contains("sofa") || lower.contains("mesa")
                || lower.contains("cama") || lower.contains("cadeira") || lower.contains("casa") || lower.contains("geleira")) {
            return "casa";
        }
        if (lower.contains("ténis") || lower.contains("tenis") || lower.contains("nike")
                || lower.contains("roupa") || lower.contains("camisa") || lower.contains("relógio") || lower.contains("vestido")) {
            return "moda";
        }
        if (lower.contains("bicicleta") || lower.contains("bola") || lower.contains("ginásio")
                || lower.contains("desporto") || lower.contains("corrida")) {
            return "desporto";
        }
        if (lower.contains("iphone") || lower.contains("samsung") || lower.contains("computador")
                || lower.contains("laptop") || lower.contains("macbook") || lower.contains("telemóvel") || lower.contains("ps5")) {
            return "tecnologia";
        }
        return "outros";
    }

    private String extractSearchKeywords(String message) {
        if (message == null) return "";
        return message.replaceAll("(?i)(procuro|quero|comprar|encontrar|comparar|preço|justo|em|luanda|benguela|huambo|anúncios|de|um|uma|para)", " ").trim();
    }

    private String formatKz(Double value) {
        if (value == null) return "0";
        NumberFormat nf = NumberFormat.getIntegerInstance(new Locale("pt", "AO"));
        return nf.format(Math.round(value));
    }
}
