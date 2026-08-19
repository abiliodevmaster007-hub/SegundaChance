# 🇦🇴 Kuenda Marketplace - Spring Boot Backend

Servidor backend completo desenvolvido em **Java 17 / Spring Boot 3** com arquitetura em camadas (Controller, Service, Repository, DTO, Model), suporte a **APIs REST** e **WebSockets em tempo real (STOMP via SockJS)**, desenhado para alimentar integralmente o frontend do Marketplace Kuenda.

---

## 🛠️ Tecnologias e Funcionalidades

- **Java 17** & **Spring Boot 3.2.3**
- **Spring Web MVC**: Endpoints RESTful para Anúncios, Chats, Mensagens, Banners e Estatísticas
- **Spring WebSocket & STOMP**: Broker de mensagens em tempo real para chat instantâneo, indicador de digitação ("A escrever...") e broadcast de novos anúncios
- **Spring Data JPA & Hibernate**: Persistência com base de dados relacional H2 in-memory pré-configurada (e driver PostgreSQL incluído para produção)
- **Bean Validation (Jakarta Validation)**: Validação rigorosa de formulários e integridade de dados
- **Lombok**: Redução de boilerplate
- **CORS Global**: Configurado para aceitar requisições do frontend Vite (`localhost:3000`, `localhost:5173`, etc.)

---

## 📁 Estrutura do Projeto (`/java`)

```
/java/
├── pom.xml                                         # Ficheiro de dependências Maven
├── README.md                                       # Guia de instalação e execução
└── src/
    ├── Main.java                                   # Ponto de entrada raiz
    └── main/
        ├── java/com/kuenda/marketplace/
        │   ├── Main.java                           # @SpringBootApplication
        │   ├── config/
        │   │   ├── CorsConfig.java                 # Configuração de CORS para frontend
        │   │   ├── WebSocketConfig.java            # STOMP /ws com SockJS
        │   │   └── DataLoader.java                 # Dados iniciais de seed (Angola)
        │   ├── controller/
        │   │   ├── ListingController.java          # CRUD de anúncios e filtros
        │   │   ├── ChatController.java             # Conversas e histórico
        │   │   ├── MessageController.java          # Envio de mensagens REST
        │   │   ├── BannerController.java           # Gestão de publicidade
        │   │   ├── UserController.java             # Perfis de utilizadores
        │   │   ├── AdminController.java            # Métricas e analytics
        │   │   └── WebSocketChatController.java    # Handler @MessageMapping STOMP
        │   ├── dto/                                # DTOs de entrada e saída
        │   ├── model/                              # Entidades JPA (Listing, User, Chat, etc.)
        │   ├── repository/                         # Interfaces Spring Data JPA
        │   └── service/                            # Lógica de negócio e broadcasts
        └── resources/
            └── application.yml                     # Configurações de porta e base de dados
```

---

## 🚀 Como Executar o Backend

### Requisitos:
- **JDK 17** ou superior instalado (`java -version`)
- **Maven 3.8+** instalado (`mvn -version`)

### Passos:
1. Abra o terminal na pasta `/java`:
   ```bash
   cd java
   ```

2. Compile e execute o projeto com o plugin Spring Boot Maven:
   ```bash
   mvn spring-boot:run
   ```

3. O servidor estará ativo em:
   - **API REST**: `http://localhost:8080/api`
   - **WebSocket STOMP**: `ws://localhost:8080/ws`
   - **H2 Web Console**: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:kuendadb`, User: `sa`, Password: vazio)

---

## 📡 Principais Rotas da API REST

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/listings` | Lista anúncios com suporte a `?category=`, `?location=`, `?search=`, `?sellerId=` |
| `POST` | `/api/listings` | Cria um novo anúncio no marketplace |
| `PUT` | `/api/listings/{id}` | Atualiza dados de um anúncio |
| `PATCH` | `/api/listings/{id}/status` | Altera status (`disponivel` / `vendido`) |
| `DELETE` | `/api/listings/{id}` | Remove um anúncio |
| `GET` | `/api/chats?userId={id}` | Retorna conversas ativas de um utilizador |
| `POST` | `/api/chats` | Inicia ou obtém uma conversa |
| `GET` | `/api/chats/{chatId}/messages` | Histórico de mensagens da conversa |
| `POST` | `/api/messages` | Envia uma nova mensagem |
| `GET` | `/api/banners` | Lista banners publicitários |
| `POST` | `/api/banners` | Cria novo banner (topo / lateral) |
| `PATCH` | `/api/banners/{id}/status` | Ativa ou pausa um banner |
| `GET` | `/api/admin/stats` | Retorna estatísticas para o painel de administração |

---

## 💬 WebSocket / STOMP

- **Endpoint de Conexão**: `/ws` (com fallback SockJS)
- **Tópicos de Subscrição (`/topic`)**:
  - `/topic/chats/{chatId}`: Mensagens em tempo real para a conversa aberta
  - `/topic/chats/{chatId}/typing`: Notificações de digitação
  - `/topic/users/{userId}/notifications`: Notificações diretas para o utilizador
  - `/topic/users/{userId}/chats`: Atualização na lista de conversas
  - `/topic/listings`: Notificação quando novos anúncios são publicados
- **Destinos de Envio (`/app`)**:
  - `/app/chat.send`: Envia uma mensagem
  - `/app/chat.typing`: Emite estado de digitação
