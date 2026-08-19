package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.ChatRequestDTO;
import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.service.ChatService;
import com.kuenda.marketplace.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Chat>> getChatsForUser(@RequestParam(required = false) String userId) {
        String targetUserId = userId;
        if (targetUserId == null || targetUserId.trim().isEmpty()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null && !"anonymousUser".equals(auth.getPrincipal())) {
                targetUserId = (String) auth.getPrincipal();
            } else {
                targetUserId = "u_maria";
            }
        }
        return ResponseEntity.ok(chatService.getChatsForUser(targetUserId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chat> getChatById(@PathVariable String id) {
        return chatService.getChatById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Chat> createChat(@Valid @RequestBody ChatRequestDTO dto) {
        Chat chat = chatService.createOrGetChat(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(chat);
    }

    @PostMapping("/start")
    public ResponseEntity<?> startChat(@RequestBody Map<String, String> payload) {
        String listingId = payload.get("listingId");
        if (listingId == null || listingId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "O listingId é obrigatório"));
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + listingId));

        String currentBuyerId = "u_maria";
        String currentBuyerName = "Maria Silva";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null && !"anonymousUser".equals(auth.getPrincipal())) {
            currentBuyerId = (String) auth.getPrincipal();
            User user = userRepository.findById(currentBuyerId).orElse(null);
            if (user != null) {
                currentBuyerName = user.getName();
            }
        }

        ChatRequestDTO dto = ChatRequestDTO.builder()
                .listingId(listing.getId())
                .listingTitle(listing.getTitle())
                .listingPrice(listing.getPrice())
                .listingImageUrl(listing.getImageUrl())
                .buyerId(currentBuyerId)
                .buyerName(currentBuyerName)
                .sellerId(listing.getSellerId())
                .sellerName(listing.getSellerName())
                .initialMessage("Olá! Tenho interesse no seu artigo " + listing.getTitle())
                .build();

        Chat chat = chatService.createOrGetChat(dto);
        return ResponseEntity.ok(chat);
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<Message>> getChatMessages(@PathVariable String chatId) {
        return ResponseEntity.ok(messageService.getMessagesForChat(chatId));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<Message> postMessageToChat(
            @PathVariable String chatId,
            @RequestBody Map<String, String> payload) {

        String text = payload.get("text");
        if (text == null || text.trim().isEmpty()) {
            throw new RuntimeException("O texto da mensagem não pode estar vazio.");
        }

        Chat chat = chatService.getChatById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat não encontrado com o ID: " + chatId));

        String senderId = "u_maria";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null && !"anonymousUser".equals(auth.getPrincipal())) {
            senderId = (String) auth.getPrincipal();
        }

        // O destinatário é o outro interveniente na conversa
        String recipientId = senderId.equals(chat.getBuyerId()) ? chat.getSellerId() : chat.getBuyerId();

        MessageRequestDTO dto = MessageRequestDTO.builder()
                .chatId(chatId)
                .senderId(senderId)
                .recipientId(recipientId)
                .text(text)
                .build();

        Message saved = messageService.saveAndBroadcastMessage(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
