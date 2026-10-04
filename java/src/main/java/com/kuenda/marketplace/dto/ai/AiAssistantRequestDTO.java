package com.kuenda.marketplace.dto.ai;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAssistantRequestDTO {
    private String message;
    private String roleContext; // "BUYER", "SELLER", "GENERAL"
    private String listingId;
    private String sellerId;
    private String chatId;
    private String category;
    private String condition;
    private String location;
    private Double currentPriceKz;
    private String draftTitle;
    private String draftNotes;
    private List<ChatHistoryItem> history;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatHistoryItem {
        private String role; // "user" ou "assistant"
        private String content;
    }
}
