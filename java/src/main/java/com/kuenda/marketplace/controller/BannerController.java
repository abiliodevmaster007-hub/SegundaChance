package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.BannerRequestDTO;
import com.kuenda.marketplace.model.Banner;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<List<Banner>> getBanners(
            @RequestParam(required = false) String position,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly
    ) {
        if (activeOnly || (position != null && !position.isBlank())) {
            return ResponseEntity.ok(bannerService.getActiveBanners(position));
        }
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    @PostMapping
    public ResponseEntity<Banner> createBanner(@Valid @RequestBody BannerRequestDTO request) {
        String currentUserId = SecurityUtils.requireCurrentUserId();
        request.setUserId(currentUserId);
        if (!SecurityUtils.isCurrentUserAdmin()) {
            request.setActive(false);
            request.setPaymentStatus("pendente");
        }
        Banner created = bannerService.createBanner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Banner> updateBanner(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates
    ) {
        SecurityUtils.requireAdmin("aprovar ou editar banners publicitários");
        return ResponseEntity.ok(bannerService.updateBanner(id, updates));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Banner> toggleBannerStatus(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body
    ) {
        SecurityUtils.requireAdmin("alterar o estado de banners publicitários");
        boolean active = body.getOrDefault("active", true);
        return ResponseEntity.ok(bannerService.toggleBannerActive(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteBanner(@PathVariable String id) {
        SecurityUtils.requireAdmin("eliminar banners publicitários");
        bannerService.deleteBanner(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
