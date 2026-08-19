package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.BannerRequestDTO;
import com.kuenda.marketplace.dto.StatusUpdateDTO;
import com.kuenda.marketplace.model.Banner;
import com.kuenda.marketplace.model.BannerPosition;
import com.kuenda.marketplace.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<List<Banner>> getAllBanners(
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) BannerPosition position) {
        return ResponseEntity.ok(bannerService.getAllBanners(activeOnly, position));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Banner> getBannerById(@PathVariable String id) {
        return bannerService.getBannerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Banner> createBanner(@Valid @RequestBody BannerRequestDTO dto) {
        Banner created = bannerService.createBanner(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Banner> updateBanner(@PathVariable String id, @Valid @RequestBody BannerRequestDTO dto) {
        return ResponseEntity.ok(bannerService.updateBanner(id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Banner> toggleBannerStatus(@PathVariable String id, @RequestBody StatusUpdateDTO dto) {
        return ResponseEntity.ok(bannerService.toggleBannerStatus(id, dto.getActive()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable String id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}
