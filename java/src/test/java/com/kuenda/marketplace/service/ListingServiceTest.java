package com.kuenda.marketplace.service;

import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.ListingCondition;
import com.kuenda.marketplace.model.ListingStatus;
import com.kuenda.marketplace.repository.ListingRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ListingService listingService;

    private Listing sampleListing;

    @BeforeEach
    void setUp() {
        sampleListing = Listing.builder()
                .id("list_1")
                .title("iPhone 13 Pro 128GB")
                .description("Excelente estado")
                .price(450000.0)
                .category("tecnologia")
                .condition(ListingCondition.excelente)
                .location("Luanda")
                .imageUrl("https://example.com/iphone.jpg")
                .sellerId("user_100")
                .sellerName("António")
                .sellerPhone("+244 923 111 222")
                .status(ListingStatus.disponivel)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deve criar um anúncio com sucesso e emitir evento WebSocket")
    void shouldCreateListingAndBroadcast() {
        ListingRequestDTO dto = ListingRequestDTO.builder()
                .title("iPhone 13 Pro 128GB")
                .description("Excelente estado")
                .price(450000.0)
                .category("tecnologia")
                .condition(ListingCondition.excelente)
                .location("Luanda")
                .sellerId("user_100")
                .sellerName("António")
                .sellerPhone("+244 923 111 222")
                .build();

        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Listing created = listingService.createListing(dto);

        assertNotNull(created);
        assertEquals("iPhone 13 Pro 128GB", created.getTitle());
        assertEquals(450000.0, created.getPrice());
        assertEquals(ListingStatus.disponivel, created.getStatus());

        verify(listingRepository, times(1)).save(any(Listing.class));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/listings"), any(Listing.class));
    }

    @Test
    @DisplayName("Deve filtrar anúncios por categoria e província")
    void shouldFilterListingsByCategoryAndLocation() {
        Listing l1 = Listing.builder().id("1").title("MacBook Pro").category("tecnologia").location("Luanda").build();
        Listing l2 = Listing.builder().id("2").title("Sofá").category("casa").location("Benguela").build();

        when(listingRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Arrays.asList(l1, l2));

        List<Listing> techListings = listingService.getAllListings("tecnologia", "Luanda", null, null);

        assertEquals(1, techListings.size());
        assertEquals("MacBook Pro", techListings.get(0).getTitle());
    }

    @Test
    @DisplayName("Proprietário do anúncio deve conseguir alterar o status para vendido com sucesso")
    void shouldUpdateListingStatusWhenOwner() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user_100", null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        when(listingRepository.findById("list_1")).thenReturn(Optional.of(sampleListing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Listing updated = listingService.updateStatus("list_1", "vendido");

        assertEquals(ListingStatus.vendido, updated.getStatus());
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/listings"), any(Listing.class));
    }

    @Test
    @DisplayName("Utilizador terceiro não deve conseguir alterar ou eliminar anúncio de outro vendedor (403 AccessDeniedException)")
    void shouldThrowAccessDeniedWhenNonOwnerAttemptsToModifyOrDeleteListing() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user_intruso", null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        when(listingRepository.findById("list_1")).thenReturn(Optional.of(sampleListing));

        assertThrows(AccessDeniedException.class, () -> listingService.updateStatus("list_1", "vendido"));
        assertThrows(AccessDeniedException.class, () -> listingService.deleteListing("list_1"));

        verify(listingRepository, never()).save(any());
        verify(listingRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar alterar status de anúncio inexistente")
    void shouldThrowExceptionWhenListingNotFound() {
        when(listingRepository.findById("inexistente")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> listingService.updateStatus("inexistente", "vendido"));
    }
}
