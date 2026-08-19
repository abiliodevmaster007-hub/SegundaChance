package com.kuenda.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "chats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chat {

    @Id
    private String id;

    @Column(nullable = false)
    private String listingId;

    private String listingTitle;

    private Double listingPrice;

    @Column(columnDefinition = "TEXT")
    private String listingImageUrl;

    @Column(nullable = false)
    private String buyerId;

    private String buyerName;

    @Column(nullable = false)
    private String sellerId;

    private String sellerName;

    @Column(columnDefinition = "TEXT")
    private String lastMessageText;

    private String lastMessageTime;

    @Builder.Default
    private String createdAt = Instant.now().toString();
}
