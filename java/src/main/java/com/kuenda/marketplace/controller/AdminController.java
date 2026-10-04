package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.AdminDashboardStatsDTO;
import com.kuenda.marketplace.dto.PlatformManagementDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.AdminService;
import com.kuenda.marketplace.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ListingService listingService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/overview")
    public ResponseEntity<PlatformManagementDTO> getPlatformOverview() {
        return ResponseEntity.ok(adminService.getPlatformOverview());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        String role = body.getOrDefault("role", "USER");
        return ResponseEntity.ok(adminService.updateUserRole(id, role));
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<User> toggleUserBan(@PathVariable String id, @RequestBody(required = false) Map<String, Boolean> body) {
        Boolean banned = body != null ? body.get("banned") : null;
        return ResponseEntity.ok(adminService.toggleUserBan(id, banned));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        SecurityUtils.getCurrentUserIdOpt().ifPresent(currentId -> {
            if (currentId.equals(id)) {
                throw new IllegalArgumentException("Um administrador não pode eliminar a sua própria conta ativa.");
            }
        });
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings/{id}/promote")
    public ResponseEntity<Listing> promoteListing(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        int days = 7;
        if (body != null && body.get("days") != null) {
            try {
                days = Integer.parseInt(body.get("days").toString());
            } catch (NumberFormatException ignored) {
            }
        }
        return ResponseEntity.ok(listingService.promoteListing(id, days));
    }

    @GetMapping("/chats")
    public ResponseEntity<List<Chat>> getAllChats() {
        return ResponseEntity.ok(adminService.getAllChats());
    }

    @PostMapping("/ai-config")
    public ResponseEntity<Map<String, String>> updateAiConfig(@RequestBody Map<String, String> body) {
        String provider = body.get("provider");
        String model = body.get("model");
        return ResponseEntity.ok(adminService.updateAiProviderConfig(provider, model));
    }
}
