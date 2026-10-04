package com.kuenda.marketplace.dto;

import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.User;
import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformManagementDTO {

    // Métricas de Negócio e Marketplace
    private long totalUsers;
    private long totalAdmins;
    private long activeListings;
    private long soldListings;
    private double totalGmvKz;
    private double totalSoldVolumeKz;
    private double avgListingPriceKz;
    private long totalChats;
    private long totalMessages;
    private long activeBanners;
    private Map<String, Long> categoryCounts;
    private Map<String, Double> categoryVolumeKz;
    private Map<String, Long> provinceCounts;

    // Estado do Servidor Backend e Runtime JVM
    private ServerHealthMetrics serverHealth;

    // Telemetria de Endpoints da API
    private List<EndpointMetric> apiEndpoints;

    // Registo de Auditoria Recente
    private List<AuditLogEntry> recentLogs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServerHealthMetrics {
        private long uptimeSeconds;
        private long memoryUsedMb;
        private long memoryMaxMb;
        private double memoryUsagePercent;
        private int cpuCores;
        private String runtimeVersion;
        private String databaseEngine;
        private String webSocketBrokerStatus;
        private String aiProvider;
        private String aiModel;
        private String serverTimestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EndpointMetric {
        private String method;
        private String path;
        private String description;
        private long callsCount;
        private double avgLatencyMs;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditLogEntry {
        private String id;
        private String timestamp;
        private String action;
        private String actor;
        private String details;
    }
}
