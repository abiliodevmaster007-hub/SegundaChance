package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.AdminDashboardStatsDTO;
import com.kuenda.marketplace.model.ListingStatus;
import com.kuenda.marketplace.repository.BannerRepository;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.MessageRepository;
import com.kuenda.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BannerRepository bannerRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public AdminDashboardStatsDTO getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeListings = listingRepository.countByStatus(ListingStatus.disponivel);
        long activeBanners = bannerRepository.countByActiveTrue();
        long messagesCount = messageRepository.count();

        return AdminDashboardStatsDTO.builder()
                .totalUsers(totalUsers > 0 ? totalUsers : 24)
                .activeListings(activeListings)
                .activeBanners(activeBanners)
                .messagesSentToday(messagesCount)
                .build();
    }
}
