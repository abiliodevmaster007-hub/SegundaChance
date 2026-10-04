package com.kuenda.marketplace.dto.ai;

import com.kuenda.marketplace.model.Listing;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAssistantResponseDTO {
    private String reply;
    private String providerUsed; // "GEMINI", "OPENAI", "SPRING_AI_HYBRID_ENGINE"
    private String modelUsed;
    private List<String> toolsExecuted;
    private AiPriceAnalysisDTO priceAnalysis;
    private AiOptimizedListingDraftDTO optimizedDraft;
    private AiSellerDiagnosticDTO sellerDiagnostic;
    private List<Listing> recommendedListings;
    private List<String> suggestedReplies;
    @Builder.Default
    private String timestamp = Instant.now().toString();
}
