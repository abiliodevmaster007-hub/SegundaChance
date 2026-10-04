package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.UserUpdateDTO;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody UserUpdateDTO dto) {
        // Apenas o próprio utilizador ou ADMIN pode atualizar o perfil
        SecurityUtils.requireOwnerOrAdmin(id, "o perfil deste utilizador");
        return ResponseEntity.ok(userService.updateUserProfile(id, dto));
    }
}
