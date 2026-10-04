package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.model.AdBanner;
import com.kuenda.marketplace.repository.AdBannerRepository;
import com.kuenda.marketplace.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BannerController {

    private final AdBannerRepository adBannerRepository;

    @GetMapping
    public ResponseEntity<List<AdBanner>> getAllBanners() {
        return ResponseEntity.ok(adBannerRepository.findAll());
    }

    /**
     * Utilizadores autenticados podem submeter campanhas para revisão (active = false).
     * Apenas utilizadores com ROLE_ADMIN podem criar banners já ativos na rotação.
     */
    @PostMapping
    public ResponseEntity<AdBanner> createBanner(@RequestBody AdBanner banner) {
        SecurityUtils.requireCurrentUserId();
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();

        if (banner.getId() == null || banner.getId().isEmpty()) {
            banner.setId("b_" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (banner.getCreatedAt() == null || banner.getCreatedAt().isEmpty()) {
            banner.setCreatedAt(Instant.now().toString());
        }
        if (!isAdmin) {
            banner.setActive(false);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(adBannerRepository.save(banner));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdBanner> updateBanner(@PathVariable String id, @RequestBody AdBanner updated) {
        return adBannerRepository.findById(id)
                .map(banner -> {
                    if (updated.getTitle() != null) banner.setTitle(updated.getTitle());
                    if (updated.getImageUrl() != null) banner.setImageUrl(updated.getImageUrl());
                    if (updated.getTargetUrl() != null) banner.setTargetUrl(updated.getTargetUrl());
                    if (updated.getPosition() != null) banner.setPosition(updated.getPosition());
                    banner.setActive(updated.isActive());
                    return ResponseEntity.ok(adBannerRepository.save(banner));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping({"/{id}/status", "/{id}/toggle"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdBanner> toggleBannerStatus(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Boolean> body) {
        return adBannerRepository.findById(id)
                .map(banner -> {
                    boolean active = (body != null && body.containsKey("active"))
                            ? body.get("active")
                            : !banner.isActive();
                    banner.setActive(active);
                    return ResponseEntity.ok(adBannerRepository.save(banner));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBanner(@PathVariable String id) {
        if (!adBannerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        adBannerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
