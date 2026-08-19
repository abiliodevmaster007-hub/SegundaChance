package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.UserUpdateDTO;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User updateUserProfile(String id, UserUpdateDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado com o ID: " + id));

        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            user.setName(dto.getName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getLocation() != null) {
            user.setLocation(dto.getLocation());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getBio() != null) {
            user.setBio(dto.getBio());
        }

        return userRepository.save(user);
    }

    @Transactional
    public User saveUser(User user) {
        return userRepository.save(user);
    }
}
