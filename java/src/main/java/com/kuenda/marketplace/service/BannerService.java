package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.BannerRequestDTO;
import com.kuenda.marketplace.model.Banner;
import com.kuenda.marketplace.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BannerService {

    private final BannerRepository bannerRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<Banner> getActiveBanners(String position) {
        if (position != null && !position.trim().isEmpty()) {
            return bannerRepository.findByPositionAndActiveTrueOrderByCreatedAtDesc(position.trim());
        }
        return bannerRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Banner> getAllBanners() {
        return bannerRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Banner> getBannerById(String id) {
        return bannerRepository.findById(id);
    }

    @Transactional
    public Banner createBanner(BannerRequestDTO dto) {
        int days = (dto.getDurationDays() != null && dto.getDurationDays() > 0) ? dto.getDurationDays() : 15;
        String expiresAt = (dto.getExpiresAt() != null && !dto.getExpiresAt().isBlank())
                ? dto.getExpiresAt()
                : Instant.now().plus(days, ChronoUnit.DAYS).toString();

        String resolvedLink = (dto.getLinkUrl() != null && !dto.getLinkUrl().isBlank())
                ? dto.getLinkUrl()
                : ((dto.getTargetUrl() != null && !dto.getTargetUrl().isBlank()) ? dto.getTargetUrl() : "#");

        String paymentStatus = (dto.getPaymentStatus() != null && !dto.getPaymentStatus().isBlank())
                ? dto.getPaymentStatus()
                : "pago";

        boolean isActive = dto.getActive() != null ? dto.getActive() : "pago".equalsIgnoreCase(paymentStatus);

        Banner banner = Banner.builder()
                .id("ban_" + UUID.randomUUID().toString().substring(0, 8))
                .title(dto.getTitle())
                .subtitle(dto.getSubtitle() != null && !dto.getSubtitle().isBlank() ? dto.getSubtitle() : "Destaque SegundaChance")
                .imageUrl(dto.getImageUrl())
                .linkUrl(resolvedLink)
                .position(dto.getPosition() != null && !dto.getPosition().isBlank() ? dto.getPosition() : "left")
                .planId(dto.getPlanId() != null ? dto.getPlanId() : "pro")
                .pricePaid(dto.getPricePaid() != null ? dto.getPricePaid() : 0.0)
                .paymentStatus(paymentStatus)
                .paymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "multicaixa_express")
                .advertiserName(dto.getAdvertiserName() != null ? dto.getAdvertiserName() : "Anunciante SegundaChance")
                .advertiserEmail(dto.getAdvertiserEmail() != null ? dto.getAdvertiserEmail() : "")
                .userId(dto.getUserId())
                .listingId(dto.getListingId())
                .active(isActive)
                .expiresAt(expiresAt)
                .createdAt(Instant.now().toString())
                .build();

        Banner saved = bannerRepository.save(banner);
        try {
            messagingTemplate.convertAndSend("/topic/banners", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir criação de banner via WebSocket: {}", e.getMessage());
        }
        return saved;
    }

    @Transactional
    public Banner updateBanner(String id, Map<String, Object> updates) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner publicitário não encontrado com o ID: " + id));

        if (updates.containsKey("active") && updates.get("active") != null) {
            banner.setActive(Boolean.parseBoolean(updates.get("active").toString()));
        }
        if (updates.containsKey("paymentStatus") && updates.get("paymentStatus") != null) {
            banner.setPaymentStatus(updates.get("paymentStatus").toString());
        }
        if (updates.containsKey("title") && updates.get("title") != null) {
            banner.setTitle(updates.get("title").toString());
        }
        if (updates.containsKey("subtitle") && updates.get("subtitle") != null) {
            banner.setSubtitle(updates.get("subtitle").toString());
        }
        if (updates.containsKey("imageUrl") && updates.get("imageUrl") != null) {
            banner.setImageUrl(updates.get("imageUrl").toString());
        }
        if (updates.containsKey("linkUrl") && updates.get("linkUrl") != null) {
            banner.setLinkUrl(updates.get("linkUrl").toString());
        }
        if (updates.containsKey("position") && updates.get("position") != null) {
            banner.setPosition(updates.get("position").toString());
        }

        Banner saved = bannerRepository.save(banner);
        try {
            messagingTemplate.convertAndSend("/topic/banners", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir atualização de banner via WebSocket: {}", e.getMessage());
        }
        return saved;
    }

    @Transactional
    public Banner toggleBannerActive(String id, boolean active) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner publicitário não encontrado com o ID: " + id));
        banner.setActive(active);
        if (active && "pendente".equalsIgnoreCase(banner.getPaymentStatus())) {
            banner.setPaymentStatus("pago");
        }
        Banner saved = bannerRepository.save(banner);
        try {
            messagingTemplate.convertAndSend("/topic/banners", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir status de banner via WebSocket: {}", e.getMessage());
        }
        return saved;
    }

    @Transactional
    public void deleteBanner(String id) {
        bannerRepository.deleteById(id);
        try {
            messagingTemplate.convertAndSend("/topic/banners/deleted", Map.of("id", id));
        } catch (Exception e) {
            log.warn("Erro ao emitir remoção de banner via WebSocket: {}", e.getMessage());
        }
    }
}
