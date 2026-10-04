package com.kuenda.marketplace.controller;

import com.kuenda.marketplace.dto.ChatRequestDTO;
import com.kuenda.marketplace.dto.MessageRequestDTO;
import com.kuenda.marketplace.model.Chat;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.Message;
import com.kuenda.marketplace.model.User;
import com.kuenda.marketplace.repository.ListingRepository;
import com.kuenda.marketplace.repository.UserRepository;
import com.kuenda.marketplace.security.SecurityUtils;
import com.kuenda.marketplace.service.ChatService;
import com.kuenda.marketplace.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
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
        String currentUserId = SecurityUtils.requireCurrentUserId();
        String targetUserId = StringUtils.hasText(userId) ? userId.trim() : currentUserId;

        // Um utilizador comum só pode listar os seus próprios chats; ADMIN pode consultar por userId
        if (!targetUserId.equals(currentUserId)) {
            SecurityUtils.requireOwnerOrAdmin(targetUserId, "as conversas deste utilizador");
        }

        return ResponseEntity.ok(chatService.getChatsForUser(targetUserId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chat> getChatById(@PathVariable String id) {
        Chat chat = chatService.getChatById(id)
                .orElseThrow(() -> new RuntimeException("Chat não encontrado com o ID: " + id));

        // Apenas comprador, vendedor ou ADMIN podem consultar detalhes do chat
        SecurityUtils.requireParticipantOrAdmin(chat.getBuyerId(), chat.getSellerId(), "esta conversa");
        return ResponseEntity.ok(chat);
    }

    @PostMapping
    public ResponseEntity<Chat> createChat(@Valid @RequestBody ChatRequestDTO dto) {
        String currentBuyerId = SecurityUtils.requireCurrentUserId();

        Listing listing = listingRepository.findById(dto.getListingId())
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + dto.getListingId()));

        if (currentBuyerId.equals(listing.getSellerId())) {
            throw new IllegalArgumentException("Não pode iniciar uma conversa sobre o seu próprio anúncio.");
        }

        User buyer = userRepository.findById(currentBuyerId).orElse(null);

        // Ignora buyerId/sellerId enviados pelo cliente e usa dados autoritativos do JWT + Base de Dados
        dto.setBuyerId(currentBuyerId);
        dto.setBuyerName(buyer != null ? buyer.getName() : "Comprador Kuenda");
        dto.setSellerId(listing.getSellerId());
        dto.setSellerName(listing.getSellerName());
        dto.setListingTitle(listing.getTitle());
        dto.setListingPrice(listing.getPrice());
        dto.setListingImageUrl(listing.getImageUrl());

        Chat chat = chatService.createOrGetChat(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(chat);
    }

    @PostMapping("/start")
    public ResponseEntity<?> startChat(@RequestBody Map<String, String> payload) {
        String listingId = payload.get("listingId");
        if (!StringUtils.hasText(listingId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "O listingId é obrigatório"));
        }

        String currentBuyerId = SecurityUtils.requireCurrentUserId();

        Listing listing = listingRepository.findById(listingId.trim())
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado com o ID: " + listingId));

        if (currentBuyerId.equals(listing.getSellerId())) {
            throw new IllegalArgumentException("Não pode iniciar uma conversa sobre o seu próprio anúncio.");
        }

        User buyer = userRepository.findById(currentBuyerId).orElse(null);
        String currentBuyerName = buyer != null ? buyer.getName() : "Comprador Kuenda";

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
        Chat chat = chatService.getChatById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat não encontrado com o ID: " + chatId));

        // Impede que terceiros leiam o histórico de mensagens de outra negociação
        SecurityUtils.requireParticipantOrAdmin(chat.getBuyerId(), chat.getSellerId(), "as mensagens desta conversa");

        return ResponseEntity.ok(messageService.getMessagesForChat(chatId));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<Message> postMessageToChat(
            @PathVariable String chatId,
            @RequestBody Map<String, String> payload) {

        String text = payload.get("text");
        if (!StringUtils.hasText(text)) {
            throw new IllegalArgumentException("O texto da mensagem não pode estar vazio.");
        }

        String senderId = SecurityUtils.requireCurrentUserId();

        Chat chat = chatService.getChatById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat não encontrado com o ID: " + chatId));

        // Apenas participantes da conversa podem enviar mensagens
        SecurityUtils.requireParticipantOrAdmin(chat.getBuyerId(), chat.getSellerId(), "enviar mensagens nesta conversa");

        String recipientId = senderId.equals(chat.getBuyerId()) ? chat.getSellerId() : chat.getBuyerId();

        MessageRequestDTO dto = MessageRequestDTO.builder()
                .chatId(chatId)
                .senderId(senderId)
                .recipientId(recipientId)
                .text(text.trim())
                .build();

        Message saved = messageService.saveAndBroadcastMessage(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
