package com.kuenda.marketplace.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsDTO {
    private long totalUsers;
    private long activeUsers;
    private long totalListings;
    private long activeListings;
    private long availableListings;
    private long soldListings;
    private long negotiatingListings;
    private long highlightedListings;
    private long activeBanners;
    private long totalChats;
    private long totalMessages;
    private long messagesSentToday;
    private double totalVolumeKz;
    private double soldVolumeKz;
    private double estimatedCommissionKz;
    private Map<String, Long> categoryDistribution;
    private Map<String, Long> provinceDistribution;
}
