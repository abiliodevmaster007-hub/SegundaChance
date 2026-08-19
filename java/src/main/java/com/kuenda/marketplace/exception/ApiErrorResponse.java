package com.kuenda.marketplace.exception;

import lombok.*;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiErrorResponse {

    @Builder.Default
    private String timestamp = Instant.now().toString();

    private int status;

    private String error;

    private String message;

    private String path;

    private Map<String, String> validationErrors;
}
