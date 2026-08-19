package com.kuenda.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kuenda.marketplace.dto.ListingRequestDTO;
import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.ListingCondition;
import com.kuenda.marketplace.model.ListingStatus;
import com.kuenda.marketplace.security.JwtAuthenticationFilter;
import com.kuenda.marketplace.security.JwtTokenProvider;
import com.kuenda.marketplace.service.ListingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ListingController.class)
@AutoConfigureMockMvc(addFilters = false)
class ListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ListingService listingService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("GET /api/listings deve retornar HTTP 200 e lista de artigos")
    void shouldReturnListingsWithStatus200() throws Exception {
        Listing listing = Listing.builder()
                .id("list_1")
                .title("Toyota Corolla")
                .price(8500000.0)
                .category("veiculos")
                .location("Luanda")
                .status(ListingStatus.disponivel)
                .build();

        when(listingService.getAllListings(null, null, null, null))
                .thenReturn(Collections.singletonList(listing));

        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Toyota Corolla"))
                .andExpect(jsonPath("$[0].price").value(8500000.0));
    }

    @Test
    @DisplayName("POST /api/listings com dados válidos deve retornar HTTP 201 Created")
    void shouldCreateListingWithStatus201() throws Exception {
        ListingRequestDTO dto = ListingRequestDTO.builder()
                .title("Samsung Galaxy S23 Ultra")
                .description("Novo na caixa lacrado")
                .price(620000.0)
                .category("tecnologia")
                .condition(ListingCondition.novo)
                .location("Luanda")
                .sellerId("user_10")
                .sellerName("Vendedor Tech")
                .build();

        Listing created = Listing.builder()
                .id("list_100")
                .title(dto.getTitle())
                .price(dto.getPrice())
                .category(dto.getCategory())
                .condition(dto.getCondition())
                .location(dto.getLocation())
                .sellerId(dto.getSellerId())
                .status(ListingStatus.disponivel)
                .build();

        when(listingService.createListing(any(ListingRequestDTO.class))).thenReturn(created);

        mockMvc.perform(post("/api/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("list_100"))
                .andExpect(jsonPath("$.title").value("Samsung Galaxy S23 Ultra"));
    }

    @Test
    @DisplayName("POST /api/listings com preço negativo ou título vazio deve retornar HTTP 400 Bad Request")
    void shouldRejectInvalidListingWithStatus400() throws Exception {
        ListingRequestDTO invalidDto = ListingRequestDTO.builder()
                .title("") // Título vazio
                .price(-50.0) // Preço inválido
                .category("tecnologia")
                .condition(ListingCondition.novo)
                .location("Luanda")
                .sellerId("user_10")
                .build();

        mockMvc.perform(post("/api/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.title").exists())
                .andExpect(jsonPath("$.validationErrors.price").exists());
    }
}
