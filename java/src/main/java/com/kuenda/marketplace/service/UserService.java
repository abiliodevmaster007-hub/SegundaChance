package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.UserUpdateDTO;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

        if (StringUtils.hasText(dto.getNewPassword())) {
            String newPass = dto.getNewPassword().trim();
            if (newPass.length() < 6) {
                throw new IllegalArgumentException("A nova palavra-passe deve ter pelo menos 6 caracteres.");
            }
            if (StringUtils.hasText(user.getPassword())) {
                if (!StringUtils.hasText(dto.getCurrentPassword()) ||
                        !passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
                    throw new IllegalArgumentException("A palavra-passe atual está incorreta.");
                }
            }
            user.setPassword(passwordEncoder.encode(newPass));
        }

        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            user.setName(dto.getName().trim());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone().trim());
        }
        if (dto.getLocation() != null) {
            user.setLocation(dto.getLocation().trim());
        }
        if (StringUtils.hasText(dto.getAvatarUrl())) {
            user.setAvatarUrl(dto.getAvatarUrl().trim());
        } else if (StringUtils.hasText(dto.getAvatar())) {
            user.setAvatarUrl(dto.getAvatar().trim());
        }
        if (dto.getBio() != null) {
            user.setBio(dto.getBio().trim());
        }

        return userRepository.save(user);
    }

    @Transactional
    public User saveUser(User user) {
        return userRepository.save(user);
    }
}
