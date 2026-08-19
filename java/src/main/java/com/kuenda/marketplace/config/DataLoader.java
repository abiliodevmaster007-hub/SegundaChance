package com.kuenda.marketplace.config;

import com.kuenda.marketplace.model.*;
import com.kuenda.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BannerRepository bannerRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    @Override
    public void run(String... args) {
        log.info("Inicializando dados padrão do Kuenda Marketplace...");

        // 1. Criar Utilizadores Iniciais
        User admin = User.builder()
                .id("u_admin")
                .name("Administrador Kuenda")
                .email("admin@kuenda.ao")
                .phone("+244 923 000 001")
                .location("Luanda")
                .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
                .bio("Gestor de moderação e suporte do Marketplace Kuenda.")
                .role("ADMIN")
                .rating(5.0)
                .totalSales(0)
                .createdAt(Instant.now().toString())
                .build();

        User seller = User.builder()
                .id("u_antonio")
                .name("António Manuel")
                .email("antonio@kuenda.ao")
                .phone("+244 923 111 222")
                .location("Luanda")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")
                .bio("Vendedor verificado em Luanda. Artigos de tecnologia e fotografia testados com garantia de funcionamento.")
                .role("USER")
                .rating(4.8)
                .totalSales(14)
                .createdAt(Instant.now().toString())
                .build();

        User buyer = User.builder()
                .id("u_maria")
                .name("Maria Silva")
                .email("maria@kuenda.ao")
                .phone("+244 934 555 666")
                .location("Benguela")
                .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80")
                .bio("Compradora ativa em Benguela. Sempre à procura de boas oportunidades e moda.")
                .role("USER")
                .rating(5.0)
                .totalSales(2)
                .createdAt(Instant.now().toString())
                .build();

        userRepository.saveAll(Arrays.asList(admin, seller, buyer));

        // 2. Criar Anúncios Iniciais
        if (listingRepository.count() == 0) {
            List<Listing> initialListings = Arrays.asList(
                    Listing.builder()
                            .id("1")
                            .title("iPhone 13 Pro 128GB Grafite")
                            .description("iPhone 13 Pro em excelente estado de conservação, bateria a 89%, com caixa original e cabo de carregamento.")
                            .price(450000.0)
                            .category("tecnologia")
                            .condition(ListingCondition.excelente)
                            .location("Luanda")
                            .imageUrl("https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80")
                            .sellerId("u_antonio")
                            .sellerName("António Manuel")
                            .sellerPhone("+244 923 111 222")
                            .status(ListingStatus.disponivel)
                            .createdAt(Instant.now().toString())
                            .build(),
                    Listing.builder()
                            .id("2")
                            .title("Toyota Land Cruiser Prado TXL 2018")
                            .description("Excelente viatura de garagem, motor a diesel 3.0, 7 lugares, ar condicionado funcional, documentos e inspeção em dia.")
                            .price(28500000.0)
                            .category("veiculos")
                            .condition(ListingCondition.excelente)
                            .location("Luanda")
                            .imageUrl("https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80")
                            .sellerId("u_antonio")
                            .sellerName("António Manuel")
                            .sellerPhone("+244 923 111 222")
                            .status(ListingStatus.disponivel)
                            .createdAt(Instant.now().toString())
                            .build(),
                    Listing.builder()
                            .id("3")
                            .title("Sofá Retrátil 3 Lugares Cinzento")
                            .description("Sofá confortável, tecido aveludado resistente a manchas, praticamente novo com 3 meses de uso.")
                            .price(185000.0)
                            .category("casa")
                            .condition(ListingCondition.novo)
                            .location("Benguela")
                            .imageUrl("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80")
                            .sellerId("u_maria")
                            .sellerName("Maria Silva")
                            .sellerPhone("+244 934 555 666")
                            .status(ListingStatus.disponivel)
                            .createdAt(Instant.now().toString())
                            .build(),
                    Listing.builder()
                            .id("4")
                            .title("Ténis Nike Air Max 90 (Tam 42)")
                            .description("Original na caixa, edição especial comprada no exterior, nunca usado.")
                            .price(55000.0)
                            .category("moda")
                            .condition(ListingCondition.novo)
                            .location("Huambo")
                            .imageUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80")
                            .sellerId("u_antonio")
                            .sellerName("António Manuel")
                            .sellerPhone("+244 923 111 222")
                            .status(ListingStatus.disponivel)
                            .createdAt(Instant.now().toString())
                            .build()
            );

            listingRepository.saveAll(initialListings);
        }

        // 3. Criar Banners Iniciais
        if (bannerRepository.count() == 0) {
            List<Banner> banners = Arrays.asList(
                    Banner.builder()
                            .id("b1")
                            .title("Unitel 5G - Conecta Angola")
                            .imageUrl("https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80")
                            .targetUrl("https://www.unitel.ao")
                            .position(BannerPosition.topo)
                            .active(true)
                            .createdAt(Instant.now().toString())
                            .build(),
                    Banner.builder()
                            .id("b2")
                            .title("Banco BAI Directo")
                            .imageUrl("https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80")
                            .targetUrl("https://www.bancobai.ao")
                            .position(BannerPosition.lateral)
                            .active(true)
                            .createdAt(Instant.now().toString())
                            .build()
            );

            bannerRepository.saveAll(banners);
        }

        // 4. Criar Chat de Demonstração
        if (chatRepository.count() == 0) {
            Chat demoChat = Chat.builder()
                    .id("chat_1")
                    .listingId("1")
                    .listingTitle("iPhone 13 Pro 128GB Grafite")
                    .listingPrice(450000.0)
                    .listingImageUrl("https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80")
                    .buyerId("u_maria")
                    .buyerName("Maria Silva")
                    .sellerId("u_antonio")
                    .sellerName("António Manuel")
                    .lastMessageText("Olá António! O telemóvel ainda está disponível para entrega no Morro Bento?")
                    .lastMessageTime(Instant.now().toString())
                    .createdAt(Instant.now().toString())
                    .build();

            chatRepository.save(demoChat);

            Message msg1 = Message.builder()
                    .id("m_1")
                    .chatId("chat_1")
                    .senderId("u_maria")
                    .recipientId("u_antonio")
                    .text("Olá António! O telemóvel ainda está disponível para entrega no Morro Bento?")
                    .createdAt(Instant.now().toString())
                    .build();

            messageRepository.save(msg1);
        }

        log.info("Base de dados do Kuenda Backend populada e pronta a servir requisições na porta 8080!");
    }
}
