package com.kuenda.marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Main {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
        System.out.println("==================================================================");
        System.out.println("🚀 Kuenda Marketplace Backend inicializado com sucesso na porta 8080!");
        System.out.println("📡 Endpoints REST: http://localhost:8080/api/listings");
        System.out.println("💬 WebSocket STOMP: ws://localhost:8080/ws");
        System.out.println("💾 Consola H2 Database: http://localhost:8080/h2-console");
        System.out.println("==================================================================");
    }
}
