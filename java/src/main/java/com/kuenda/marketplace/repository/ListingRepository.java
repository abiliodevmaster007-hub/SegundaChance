package com.kuenda.marketplace.repository;

import com.kuenda.marketplace.model.Listing;
import com.kuenda.marketplace.model.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, String>, JpaSpecificationExecutor<Listing> {
    List<Listing> findBySellerIdOrderByCreatedAtDesc(String sellerId);
    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    List<Listing> findAllByOrderByCreatedAtDesc();
    long countByStatus(ListingStatus status);
}
