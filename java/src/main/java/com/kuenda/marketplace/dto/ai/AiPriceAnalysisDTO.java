package com.kuenda.marketplace.dto.ai;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPriceAnalysisDTO {
    private String category;
    private String location;
    private String condition;
    private Double targetPriceKz;
    private Double minPriceKz;
    private Double avgPriceKz;
    private Double maxPriceKz;
    private Double suggestedOptimalPriceKz;
    private String verdict; // "ABAIXO_DO_MERCADO", "PRECO_JUSTO", "ACIMA_DO_MERCADO"
    private Double diffPercentage;
    private int sampleSize;
    private String explanation;
    private List<String> safetyTips;
}
