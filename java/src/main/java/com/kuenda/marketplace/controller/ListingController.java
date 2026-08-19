package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.dto.StatusUpdateDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
            @RequestParam(required = false) String sellerId) {
        return ResponseEntity.ok(listingService.getAllListings(category, location, search, sellerId));
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
        // Se o sellerId não for enviado explicitamente no corpo, resolve pelo utilizador autenticado no JWT
        if (dto.getSellerId() == null || dto.getSellerId().trim().isEmpty()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null && !"anonymousUser".equals(auth.getPrincipal())) {
                String userId = (String) auth.getPrincipal();
                dto.setSellerId(userId);
                userRepository.findById(userId).ifPresent(u -> {
                    if (dto.getSellerName() == null) dto.setSellerName(u.getName());
                    if (dto.getSellerPhone() == null) dto.setSellerPhone(u.getPhone());
                });
            } else {
                dto.setSellerId("u_antonio");
                dto.setSellerName("António Manuel");
                dto.setSellerPhone("+244 923 111 222");
            }
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
