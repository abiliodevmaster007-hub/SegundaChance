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

    @Column(columnDefinition = "TEXT")
    private String sellerAvatar;

    @Builder.Default
    private Double sellerRating = 5.0;

    @Builder.Default
    private Boolean featured = false;

    private String highlightedUntil;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    @Builder.Default
    private java.util.List<String> images = new java.util.ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ListingStatus status = ListingStatus.disponivel;

    @Builder.Default
    private String createdAt = Instant.now().toString();

    public java.util.List<String> getImages() {
        if (images != null && !images.isEmpty()) {
            return images;
        }
        if (imageUrl != null && !imageUrl.isBlank()) {
            return java.util.List.of(imageUrl);
        }
        return java.util.Collections.emptyList();
    }
}
