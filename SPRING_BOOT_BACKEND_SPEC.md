# Especificação Técnica de Integração: Spring Boot Back-end

Este guia descreve os modelos, relações, controladores e estruturas WebSockets com **STOMP sobre SockJS** necessários para alimentar a aplicação **SegundaChance Angola** via Spring Boot 3.x.

---

## 1. Modelo de Base de Dados (Entidades JPA / PostgreSQL)

### 1.1 Entidade `User`
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password; // Bcrypt Hash

    private String phone;
    private String location; // ex: "Luanda", "Benguela"
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private Double rating = 4.8;
    private Integer totalSales = 0;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER; // USER, ADMIN

    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### 1.2 Entidade `Listing` (Anúncio)
```java
@Entity
@Table(name = "listings")
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String category; // ex: "vestuario", "imoveis"

    @Column(nullable = false)
    private String condition; // ex: "novo", "excelente"

    @Column(nullable = false)
    private String location; // ex: "Luanda"

    private String imageUrl;

    @Column(nullable = false)
    private String status = "disponivel"; // "disponivel", "vendido", "suspenso"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### 1.3 Entidade `Chat` (Conversação P2P)
```java
@Entity
@Table(name = "chats")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    private String lastMessageText;
    private LocalDateTime lastMessageTime = LocalDateTime.now();
}
```

### 1.4 Entidade `Message` (Mensagens de Negociação)
```java
@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### 1.5 Entidade `AdBanner` (Publicidade Rotativa Lateral)
```java
@Entity
@Table(name = "ad_banners")
public class AdBanner {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private String targetUrl;

    @Column(nullable = false)
    private String position = "lateral"; // "lateral", "topo"

    private boolean active = false; // Aguarda aprovação/pagamento do admin

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advertiser_id")
    private User advertiser; // Associação opcional ao utilizador que comprou a publicidade

    private String paymentReference;
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

## 2. APIs REST (Mapeamento de Endpoints do Front-end)

| Método | Endpoint | Descrição | Substituição de código estático no React |
|---|---|---|---|
| **POST** | `/api/auth/login` | Login do utilizador, retorna JWT | `AuthModal.tsx` -> Submeter formulário |
| **POST** | `/api/auth/register` | Registo de um novo utilizador | `AuthModal.tsx` -> Signup formulário |
| **GET** | `/api/users/{id}` | Carregar dados do perfil no ecrã | `UserProfile.tsx` -> Carregar perfil do utilizador |
| **PUT** | `/api/users/{id}` | Atualizar detalhes (bio, nome, foto) | `UserProfile.tsx` -> `handleUpdateProfile` |
| **GET** | `/api/listings` | Lista anúncios filtrados | `App.tsx` -> `fetchListings()` |
| **POST** | `/api/listings` | Criar novo anúncio (desapego) | `CreateListingModal.tsx` -> FormData de imagem |
| **PATCH** | `/api/listings/{id}/status` | Marcar como vendido / reativar | `App.tsx` -> `handleToggleListingStatus` |
| **DELETE** | `/api/listings/{id}` | Apagar anúncio permanentemente | `App.tsx` -> `handleDeleteListing` |
| **GET** | `/api/chats`| Obter negociações ativas | `App.tsx` -> `fetchChats()` |
| **GET** | `/api/chats/{chatId}/messages`| Obter histórico de chat | `App.tsx` -> `fetchMessages()` |
| **POST** | `/api/chats/start`| Criar/Recuperar chat para um anúncio | `App.tsx` -> `handleContactSellerInput()` |
| **GET** | `/api/ads/active`| Obter banners publicitários ativos | `AdSidePanel.tsx` -> Listagem e Rotação |
| **POST** | `/api/ads/promote`| Submeter banner publicitário com ref de pagamento | `UserProfile.tsx` -> Submissão de anúncio pago |
| **GET** | `/api/admin/dashboard`| Métricas globais da plataforma para Admin | `AdminPanel.tsx` -> Dashboard de Estatísticas |
| **PATCH** | `/api/admin/listings/{id}/status`| Gerir publicamente visibilidade | `App.tsx` -> `handleUpdateListingStatusAdmin` |
| **DELETE** | `/api/admin/listings/{id}`| Eliminar anúncio por violação | `App.tsx` -> `handleDeleteListingAdmin` |
| **POST** | `/api/admin/ads`| Criar banner publicitário administrativamente | `App.tsx` -> `handleCreateBanner` |
| **PATCH** | `/api/admin/ads/{id}/toggle`| Ativar/Desativar publicidade | `App.tsx` -> `handleToggleBanner` |
| **DELETE** | `/api/admin/ads/{id}`| Eliminar publicidade permanentemente | `App.tsx` -> `handleDeleteBanner` |

---

## 3. Configuração de WebSockets com Spring Boot (STOMP e SockJS)

### 3.1 Classe de Configuração `WebSocketConfig`
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita um broker simples em memória para enviar mensagens para subscritores
        config.enableSimpleBroker("/topic");
        // Prefixo para mensagens enviadas por um cliente direcionadas aos @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Ponto de entrada do WebSocket para a aplicação React conectar usando SockJS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

### 3.2 Controlador de Mensagens do Chat `ChatController`
```java
@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRepository chatRepository;

    /**
     * Ponto de recepção do front-end: `webSocketService.send("/app/chat.send", sentMsg)`
     * Spring Boot recebe, persiste, e retransmite para os ouvintes correspondentes.
     */
    @MessageMapping("/chat.send")
    public void processMessage(@Payload MessageDto messageDto) {
        // 1. Guardar no banco de dados
        Message message = new Message();
        // preencher do DTO...
        messageRepository.save(message);

        // 2. Atualizar o histórico resumido no chat correspondente
        Chat chat = chatRepository.findById(messageDto.getChatId()).orElseThrow();
        chat.setLastMessageText(messageDto.getText());
        chat.setLastMessageTime(LocalDateTime.now());
        chatRepository.save(chat);

        // 3. Difundir para o canal específico do destinatário
        // Canal: `/topic/messages/{userId}`
        messagingTemplate.convertAndSend("/topic/messages/" + messageDto.getRecipientId(), messageDto);
        
        // 4. Também devolver cópia ao remetente para sincronização multidispositivo instantânea
        messagingTemplate.convertAndSend("/topic/messages/" + messageDto.getSenderId(), messageDto);
    }
}
```

Este plano garante que as chamadas estáticas `webSocketService.subscribe("/topic/messages/" + userId, ...)` e `webSocketService.send("/app/chat.send", msg)` mapeiem diretamente a nível profissional um servidor Spring Boot corporativo sem reescrita de código da lógica do lado do cliente.
