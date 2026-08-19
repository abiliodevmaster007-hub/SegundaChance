package com.kuenda.marketplace.repository;

import com.kuenda.marketplace.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, String> {
    
    @Query("SELECT c FROM Chat c WHERE c.buyerId = :userId OR c.sellerId = :userId ORDER BY c.createdAt DESC")
    List<Chat> findByUserId(@Param("userId") String userId);

    Optional<Chat> findByListingIdAndBuyerId(String listingId, String buyerId);
}
