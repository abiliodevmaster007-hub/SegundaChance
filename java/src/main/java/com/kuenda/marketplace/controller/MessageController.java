package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<Message> sendMessage(@Valid @RequestBody MessageRequestDTO dto) {
        Message created = messageService.saveAndBroadcastMessage(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
