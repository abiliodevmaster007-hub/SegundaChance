package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.AdminDashboardStatsDTO;
import com.kuenda.marketplace.dto.PlatformManagementDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

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

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
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
