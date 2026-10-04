package com.kuenda.marketplace.repository;

import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, String>, JpaSpecificationExecutor<Listing> {
    List<Listing> findBySellerIdOrderByCreatedAtDesc(String sellerId);
    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    List<Listing> findAllByOrderByCreatedAtDesc();
    long countByStatus(ListingStatus status);

    @Query("""
            SELECT l FROM Listing l
            WHERE (:sellerId IS NULL OR :sellerId = '' OR LOWER(l.sellerId) = LOWER(:sellerId))
              AND (:category IS NULL OR :category = '' OR LOWER(:category) = 'todos' OR LOWER(l.category) = LOWER(:category))
              AND (:location IS NULL OR :location = '' OR LOWER(:location) = 'todas' OR LOWER(:location) = 'todos' OR LOWER(l.location) = LOWER(:location))
              AND (:search IS NULL OR :search = '' OR LOWER(l.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.description) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY l.createdAt DESC
            """)
    Page<Listing> searchListings(
            @Param("category") String category,
            @Param("location") String location,
            @Param("search") String search,
            @Param("sellerId") String sellerId,
            Pageable pageable
    );
}
