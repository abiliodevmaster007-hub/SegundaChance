package com.kuenda.marketplace.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusUpdateDTO {
    private String status;
    private Boolean active;
}
