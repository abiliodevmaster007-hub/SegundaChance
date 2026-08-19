package com.kuenda.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingCondition condition;

    @Column(nullable = false)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false)
    private String sellerId;

    private String sellerName;

    private String sellerPhone;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ListingStatus status = ListingStatus.disponivel;

    @Builder.Default
    private String createdAt = Instant.now().toString();
}
