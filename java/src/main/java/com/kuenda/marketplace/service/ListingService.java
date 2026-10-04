package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.ListingStatus;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "tecnologia", "veiculos", "casa", "moda", "desporto", "outros"
    );

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private final ListingRepository listingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Consulta paginada e filtrada diretamente na base de dados (H2 / PostgreSQL).
     */
    @Transactional(readOnly = true)
    public Page<Listing> getListingsPage(
            String category,
            String location,
            String search,
            String sellerId,
            int page,
            int size) {

        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Listing> dbPage = listingRepository.searchListings(
                normalizeFilter(category),
                normalizeFilter(location),
                normalizeFilter(search),
                normalizeFilter(sellerId),
                pageable
        );

        if (dbPage != null) {
            return dbPage;
        }

        // Fallback seguro quando executado em testes unitários com mocks parciais
        List<Listing> filtered = filterInMemory(
                listingRepository.findAllByOrderByCreatedAtDesc(),
                category,
                location,
                search,
                sellerId
        );
        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    @Transactional(readOnly = true)
    public List<Listing> getAllListings(String category, String location, String search, String sellerId) {
        return getListingsPage(category, location, search, sellerId, 0, DEFAULT_PAGE_SIZE).getContent();
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
        validateListingBusinessRules(dto);
        String resolvedSellerId = SecurityUtils.getCurrentUserIdOpt().orElse(dto.getSellerId());

        Listing listing = Listing.builder()
                .id("list_" + UUID.randomUUID().toString().substring(0, 8))
                .title(dto.getTitle().trim())
                .description(dto.getDescription() != null ? dto.getDescription().trim() : "")
                .price(dto.getPrice())
                .category(dto.getCategory().trim().toLowerCase())
                .condition(dto.getCondition())
                .location(dto.getLocation().trim())
                .imageUrl(dto.getImageUrl())
                .sellerId(resolvedSellerId)
                .sellerName(dto.getSellerName() != null ? dto.getSellerName() : "Vendedor Kuenda")
                .sellerPhone(dto.getSellerPhone() != null ? dto.getSellerPhone() : "")
                .status(ListingStatus.disponivel)
                .createdAt(Instant.now().toString())
                .build();

        Listing saved = listingRepository.save(listing);
        log.info("Novo anúncio criado com sucesso: {} (ID: {}, Vendedor: {})", saved.getTitle(), saved.getId(), saved.getSellerId());

        try {
            messagingTemplate.convertAndSend("/topic/listings", saved);
        } catch (Exception e) {
            log.warn("Erro ao emitir evento de novo anúncio via WebSocket: {}", e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Listing updateListing(String id, ListingRequestDTO dto) {
        validateListingBusinessRules(dto);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + id));

        if (SecurityUtils.getCurrentUserIdOpt().isPresent()) {
            SecurityUtils.requireOwnerOrAdmin(listing.getSellerId(), "este anúncio");
        }

        listing.setTitle(dto.getTitle().trim());
        listing.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");
        listing.setPrice(dto.getPrice());
        listing.setCategory(dto.getCategory().trim().toLowerCase());
        listing.setCondition(dto.getCondition());
        listing.setLocation(dto.getLocation().trim());
        if (dto.getImageUrl() != null && !dto.getImageUrl().trim().isEmpty()) {
            listing.setImageUrl(dto.getImageUrl().trim());
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
        if (!StringUtils.hasText(status) ||
                (!"disponivel".equalsIgnoreCase(status.trim()) && !"vendido".equalsIgnoreCase(status.trim()))) {
            throw new IllegalArgumentException("Estado de anúncio inválido. Valores permitidos: 'disponivel' ou 'vendido'.");
        }

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + id));

        if (SecurityUtils.getCurrentUserIdOpt().isPresent()) {
            SecurityUtils.requireOwnerOrAdmin(listing.getSellerId(), "o estado deste anúncio");
        }

        ListingStatus newStatus = "vendido".equalsIgnoreCase(status.trim()) ? ListingStatus.vendido : ListingStatus.disponivel;
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
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + id));

        if (SecurityUtils.getCurrentUserIdOpt().isPresent()) {
            SecurityUtils.requireOwnerOrAdmin(listing.getSellerId(), "este anúncio");
        }

        listingRepository.deleteById(id);
        try {
            messagingTemplate.convertAndSend("/topic/listings/deleted", id);
        } catch (Exception e) {
            log.warn("Erro ao emitir deleção via WebSocket: {}", e.getMessage());
        }
    }

    private void validateListingBusinessRules(ListingRequestDTO dto) {
        if (dto.getPrice() == null || dto.getPrice() <= 0) {
            throw new IllegalArgumentException("O preço do anúncio deve ser superior a zero Kwanzas.");
        }
        if (!StringUtils.hasText(dto.getCategory()) ||
                !ALLOWED_CATEGORIES.contains(dto.getCategory().trim().toLowerCase())) {
            throw new IllegalArgumentException(
                    "Categoria inválida. Categorias suportadas: " + String.join(", ", ALLOWED_CATEGORIES)
            );
        }
        if (dto.getCondition() == null) {
            throw new IllegalArgumentException("A condição do artigo é obrigatória.");
        }
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private List<Listing> filterInMemory(
            List<Listing> all,
            String category,
            String location,
            String search,
            String sellerId) {
        return all.stream()
                .filter(item -> {
                    if (sellerId != null && !sellerId.trim().isEmpty()) {
                        return item.getSellerId() != null && item.getSellerId().equalsIgnoreCase(sellerId.trim());
                    }
                    return true;
                })
                .filter(item -> {
                    if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("todos")) {
                        return item.getCategory() != null && item.getCategory().equalsIgnoreCase(category.trim());
                    }
                    return true;
                })
                .filter(item -> {
                    if (location != null && !location.trim().isEmpty() && !location.equalsIgnoreCase("todas") && !location.equalsIgnoreCase("todos")) {
                        return item.getLocation() != null && item.getLocation().equalsIgnoreCase(location.trim());
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
}
