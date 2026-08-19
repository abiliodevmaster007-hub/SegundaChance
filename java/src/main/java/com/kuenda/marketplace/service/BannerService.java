package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.BannerRequestDTO;
import com.kuenda.marketplace.model.Banner;
import com.kuenda.marketplace.model.BannerPosition;
import com.kuenda.marketplace.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BannerService {

    private final BannerRepository bannerRepository;

    @Transactional(readOnly = true)
    public List<Banner> getAllBanners(Boolean activeOnly, BannerPosition position) {
        if (Boolean.TRUE.equals(activeOnly)) {
            if (position != null) {
                return bannerRepository.findByPositionAndActiveTrue(position);
            }
            return bannerRepository.findByActiveTrueOrderByCreatedAtDesc();
        }
        return bannerRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Banner> getBannerById(String id) {
        return bannerRepository.findById(id);
    }

    @Transactional
    public Banner createBanner(BannerRequestDTO dto) {
        Banner banner = Banner.builder()
                .id("ban_" + UUID.randomUUID().toString().substring(0, 8))
                .title(dto.getTitle())
                .imageUrl(dto.getImageUrl())
                .targetUrl(dto.getTargetUrl())
                .position(dto.getPosition())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .createdAt(Instant.now().toString())
                .build();

        return bannerRepository.save(banner);
    }

    @Transactional
    public Banner updateBanner(String id, BannerRequestDTO dto) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner publicitário não encontrado com o ID: " + id));

        banner.setTitle(dto.getTitle());
        banner.setImageUrl(dto.getImageUrl());
        banner.setTargetUrl(dto.getTargetUrl());
        banner.setPosition(dto.getPosition());
        if (dto.getActive() != null) {
            banner.setActive(dto.getActive());
        }

        return bannerRepository.save(banner);
    }

    @Transactional
    public Banner toggleBannerStatus(String id, Boolean active) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner publicitário não encontrado com o ID: " + id));

        if (active != null) {
            banner.setActive(active);
        } else {
            banner.setActive(!banner.isActive());
        }

        return bannerRepository.save(banner);
    }

    @Transactional
    public void deleteBanner(String id) {
        bannerRepository.deleteById(id);
    }
}
