package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.AdminDashboardStatsDTO;
import com.kuenda.marketplace.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
