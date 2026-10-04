package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.dto.StatusUpdateDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ListingController {

    private final ListingService listingService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Listing>> getAllListings(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sellerId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null || size != null) {
            int p = page != null ? page : 0;
            int s = size != null ? size : 50;
            return ResponseEntity.ok(
                    listingService.getListingsPage(category, location, search, sellerId, p, s).getContent()
            );
        }
        return ResponseEntity.ok(listingService.getAllListings(category, location, search, sellerId));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Listing>> getListingsPage(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(listingService.getListingsPage(category, location, search, sellerId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Listing> getListingById(@PathVariable String id) {
        return listingService.getListingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Listing>> getListingsBySeller(@PathVariable String sellerId) {
        return ResponseEntity.ok(listingService.getListingsBySeller(sellerId));
    }

    @PostMapping
    public ResponseEntity<Listing> createListing(@Valid @RequestBody ListingRequestDTO dto) {
        // Extrai obrigatoriamente o vendedor do token JWT autenticado (ignora sellerId enviado pelo cliente)
        String currentUserId = SecurityUtils.requireCurrentUserId();
        dto.setSellerId(currentUserId);

        User seller = userRepository.findById(currentUserId).orElse(null);
        if (seller != null) {
            dto.setSellerName(seller.getName());
            dto.setSellerPhone(seller.getPhone());
        }

        Listing created = listingService.createListing(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Listing> updateListing(@PathVariable String id, @Valid @RequestBody ListingRequestDTO dto) {
        return ResponseEntity.ok(listingService.updateListing(id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Listing> updateStatus(@PathVariable String id, @RequestBody StatusUpdateDTO dto) {
        return ResponseEntity.ok(listingService.updateStatus(id, dto.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable String id) {
        listingService.deleteListing(id);
        return ResponseEntity.noContent().build();
    }
}
