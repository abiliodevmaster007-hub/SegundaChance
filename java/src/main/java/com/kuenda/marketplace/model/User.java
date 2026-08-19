package com.kuenda.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    private String location;

    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private Double rating;

    private Integer totalSales;

    @Builder.Default
    private String role = "USER";

    @Builder.Default
    private String createdAt = Instant.now().toString();
}
