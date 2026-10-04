package com.kuenda.marketplace.repository;

import com.kuenda.marketplace.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {
    List<Banner> findByActiveTrueOrderByCreatedAtDesc();
    List<Banner> findByPositionAndActiveTrueOrderByCreatedAtDesc(String position);
    List<Banner> findAllByOrderByCreatedAtDesc();
    long countByActiveTrue();
}
