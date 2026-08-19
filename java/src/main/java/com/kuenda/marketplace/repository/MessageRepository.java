package com.kuenda.marketplace.repository;

import com.kuenda.marketplace.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByChatIdOrderByCreatedAtAsc(String chatId);
    long count();
}
