package com.kuenda.marketplace.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private String phone;

    private String location;

    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Builder.Default
    private Double rating = 5.0;

    @Builder.Default
    private Integer reviewCount = 1;

    @Builder.Default
    private Integer totalSales = 0;

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Boolean banned = false;

    @Builder.Default
    @Column(nullable = false)
    private String role = "USER";

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private String createdAt = Instant.now().toString();

    public String getAvatar() {
        return this.avatarUrl;
    }

    public void setAvatar(String avatar) {
        if (avatar != null && !avatar.isBlank()) {
            this.avatarUrl = avatar;
        }
    }
}
