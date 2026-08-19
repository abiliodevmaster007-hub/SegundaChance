package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.ListingStatus;
import com.kuenda.marketplace.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingService {

    private final ListingRepository listingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<Listing> getAllListings(String category, String location, String search, String sellerId) {
        List<Listing> all = listingRepository.findAllByOrderByCreatedAtDesc();

        return all.stream()
                .filter(item -> {
                    if (sellerId != null && !sellerId.trim().isEmpty()) {
                        return item.getSellerId().equalsIgnoreCase(sellerId.trim());
                    }
                    return true;
                })
                .filter(item -> {
                    if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("todos")) {
                        return item.getCategory().equalsIgnoreCase(category.trim());
                    }
                    return true;
                })
                .filter(item -> {
                    if (location != null && !location.trim().isEmpty() && !location.equalsIgnoreCase("todas")) {
                        return item.getLocation().equalsIgnoreCase(location.trim());
                    }
                    return true;
                })
                .filter(item -> {
                    if (search != null && !search.trim().isEmpty()) {
                        String s = search.toLowerCase().trim();
                        boolean matchesTitle = item.getTitle() != null && item.getTitle().toLowerCase().contains(s);
                        boolean matchesDesc = item.getDescription() != null && item.getDescription().toLowerCase().contains(s);
                        return matchesTitle || matchesDesc;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<Listing> getListingById(String id) {
        return listingRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Listing> getListingsBySeller(String sellerId) {
        return listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    @Transactional
    public Listing createListing(ListingRequestDTO dto) {
        Listing listing = Listing.builder()
                .id(dto.getId() != null && !dto.getId().trim().isEmpty() ? dto.getId() : "list_" + UUID.randomUUID().toString().substring(0, 8))
                .title(dto.getTitle())
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .price(dto.getPrice())
                .category(dto.getCategory())
                .condition(dto.getCondition())
                .location(dto.getLocation())
                .imageUrl(dto.getImageUrl())
                .sellerId(dto.getSellerId())
                .sellerName(dto.getSellerName() != null ? dto.getSellerName() : "Vendedor Kuenda")
                .sellerPhone(dto.getSellerPhone() != null ? dto.getSellerPhone() : "")
                .status(ListingStatus.disponivel)
                .createdAt(Instant.now().toString())
                .build();

        Listing saved = listingRepository.save(listing);
        log.info("Novo anúncio criado com sucesso: {} (ID: {})", saved.getTitle(), saved.getId());

        // Notifica clientes em tempo real via WebSocket broker
        try {
            messagingTemplate.convertAndSend("/topic/listings", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir evento de novo anúncio via WebSocket: {}", e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Listing updateListing(String id, ListingRequestDTO dto) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + id));

        listing.setTitle(dto.getTitle());
        listing.setDescription(dto.getDescription());
        listing.setPrice(dto.getPrice());
        listing.setCategory(dto.getCategory());
        listing.setCondition(dto.getCondition());
        listing.setLocation(dto.getLocation());
        if (dto.getImageUrl() != null && !dto.getImageUrl().trim().isEmpty()) {
            listing.setImageUrl(dto.getImageUrl());
        }

        Listing updated = listingRepository.save(listing);
        try {
            messagingTemplate.convertAndSend("/topic/listings", updated);
        } catch (Exception e) {
            log.warn("Erro ao emitir atualização via WebSocket: {}", e.getMessage());
        }

        return updated;
    }

    @Transactional
    public Listing updateStatus(String id, String status) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + id));

        ListingStatus newStatus = "vendido".equalsIgnoreCase(status) ? ListingStatus.vendido : ListingStatus.disponivel;
        listing.setStatus(newStatus);
        Listing updated = listingRepository.save(listing);

        try {
            messagingTemplate.convertAndSend("/topic/listings", updated);
        } catch (Exception e) {
            log.warn("Erro ao emitir mudança de status via WebSocket: {}", e.getMessage());
        }

        return updated;
    }

    @Transactional
    public void deleteListing(String id) {
        if (listingRepository.existsById(id)) {
            listingRepository.deleteById(id);
            try {
                messagingTemplate.convertAndSend("/topic/listings/deleted", id);
            } catch (Exception e) {
                log.warn("Erro ao emitir deleção via WebSocket: {}", e.getMessage());
            }
        }
    }
}
