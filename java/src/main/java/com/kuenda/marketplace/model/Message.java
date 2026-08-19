package com.kuenda.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private String id;

    @Column(nullable = false)
    private String chatId;

    @Column(nullable = false)
    private String senderId;

    @Column(nullable = false)
    private String recipientId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Builder.Default
    private String createdAt = Instant.now().toString();
}
