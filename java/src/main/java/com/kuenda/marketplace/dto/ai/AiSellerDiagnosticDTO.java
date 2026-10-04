package com.kuenda.marketplace.dto.ai;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSellerDiagnosticDTO {
    private String sellerId;
    private int totalListings;
    private int activeListings;
    private int soldListings;
    private Double conversionRatePercent;
    private Double totalActiveValueKz;
    private Double totalSoldRevenueKz;
    private String overallHealth; // "EXCELENTE", "BOM", "PRECISA_ATENCAO"
    private List<String> actionableInsights;
    private List<String> pricingAlerts;
}
