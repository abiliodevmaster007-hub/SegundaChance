package com.kuenda.marketplace.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsDTO {
    private long totalUsers;
    private long activeListings;
    private long activeBanners;
    private long messagesSentToday;
}
