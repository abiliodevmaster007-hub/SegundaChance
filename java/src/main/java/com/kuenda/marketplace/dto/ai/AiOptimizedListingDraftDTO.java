package com.kuenda.marketplace.dto.ai;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiOptimizedListingDraftDTO {
    private String suggestedTitle;
    private String suggestedDescription;
    private String suggestedCategory;
    private String suggestedCondition;
    private Double suggestedPriceKz;
    private List<String> highlightTags;
    private List<String> sellingTips;
}
