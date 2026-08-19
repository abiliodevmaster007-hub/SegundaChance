package com.kuenda.marketplace.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateDTO {
    private String name;
    private String phone;
    private String location;
    private String avatarUrl;
    private String bio;
}
