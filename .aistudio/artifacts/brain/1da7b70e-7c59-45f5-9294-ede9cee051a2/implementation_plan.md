# Kuenda AI — Assistente Inteligente 360º com Spring AI & Function Calling

Implementação de um ecossistema completo de Inteligência Artificial integrado ao **Kuenda Marketplace**, combinando **Spring AI** no servidor com ferramentas executáveis (*Function Calling / Tools*) em tempo real sobre os dados da plataforma para oferecer suporte 100% contextual a **Compradores** e **Vendedores** em Angola.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo refletem exatamente as escolhas confirmadas e orientam a arquitetura do assistente tanto no servidor quanto na interface:

- **Decisão Confirmada 1 — Motor Spring AI Híbrido Multi-Provedor**: Configuração flexível via variáveis de ambiente (`AI_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`), permitindo alternar de forma transparente entre **Google Gemini** e **OpenAI / Modelos Compatíveis** através da abstração `ChatClient` do Spring AI, com fallback resiliente.
- **Decisão Confirmada 2 — Arsenal Completo de Ferramentas para Vendedores**:
  - **Precificação Inteligente em Kwanzas (Kz)**: Calcula faixas de preço recomendadas (mínimo, médio, competitivo) cruzando anúncios reais da mesma categoria, condição e província.
  - **Gerador e Otimizador Automático de Anúncios**: Cria títulos apelativos, descrições estruturadas e sugere a melhor categoria a partir de breves notas do vendedor.
  - **Diagnóstico de Performance e Dicas de Venda**: Analisa o portfólio ativo do vendedor e aponta melhorias práticas para acelerar o fecho de negócios.
  - **Assistente de Resposta Rápida no Chat**: Sugere respostas cordiais, contrapropostas de negociação e confirmação de encontro seguro.
- **Decisão Confirmada 3 — Arsenal Completo de Ferramentas para Compradores & Omnicanalidade na UI**:
  - **Busca Inteligente e Comparador de Ofertas**: Pesquisa conversacional no catálogo vivo e comparação lado a lado do custo-benefício.
  - **Avaliador de Preço Justo e Guia de Segurança**: Verifica se o valor pedido num anúncio está abaixo, dentro ou acima da média do mercado angolano e fornece checklist de segurança local.
  - **Presença Tripla na Interface**:
    1. **Aba Exclusiva "Kuenda AI"** na barra de navegação principal.
    2. **Assistente Flutuante Global** acessível em qualquer ecrã.
    3. **Atalhos Contextuais Integrados** dentro do modal de criação de anúncio, nos detalhes do produto e na janela de mensagens.

---

## 1. Overview & Core Concept

- **O que faz**: Transforma o Kuenda Marketplace numa plataforma assistida por IA onde o utilizador não apenas navega por anúncios, mas conta com um especialista de mercado angolano capaz de consultar a base de dados em tempo real, redigir anúncios otimizados, auditar preços em Kwanzas e apoiar negociações no chat.
- **Público-Alvo**:
  - **Compradores**: Utilizadores que procuram o melhor negócio na sua província, querem comparar produtos similares e validar se o preço pedido é justo e seguro.
  - **Vendedores**: Comerciantes e particulares que desejam publicar anúncios profissionais em segundos, definir preços competitivos em Kz e responder rapidamente a interessados.
- **Valor Diferencial no Mercado**: Ao contrário de um chatbot genérico, o **Kuenda AI** utiliza *Function Calling* no servidor para inspecionar o catálogo real da plataforma, calcular métricas estatísticas reais em Kwanzas (`tabular-nums`) e preencher formulários ou respostas de chat com um único clique.

---

## 2. User Experience & Visual Design

### Fluxos Principais do Utilizador
1. **Aba Dedicada Kuenda AI (Workspace Consultivo)**:
   - O utilizador acede à aba **Kuenda AI** no topo da aplicação.
   - Escolhe o modo de atuação (**Modo Comprador** ou **Modo Vendedor**) ou utiliza os cartões de ação rápida (*"Avaliar preço de um iPhone em Luanda"*, *"Gerar anúncio otimizado"*, *"Diagnosticar os meus anúncios"*, *"Comparar ofertas da categoria"*).
   - Quando a IA aciona uma ferramenta de servidor, a resposta apresenta cartões interativos de anúncios encontrados, tabelas comparativas de preço em Kwanzas ou rascunhos prontos para publicar.
2. **Atalho Contextual na Criação de Anúncio (Vendedor)**:
   - Dentro do modal de **Publicar Anúncio**, o vendedor clica em **"Otimizar com Kuenda AI"** ou **"Sugerir Preço Justo (Kz)"**.
   - A IA analisa o título/notas parciais, consulta os preços praticados na província selecionada e preenche automaticamente o título otimizado, descrição estruturada e preço sugerido.
3. **Atalho Contextual no Detalhe do Produto e no Chat (Comprador & Vendedor)**:
   - No modal de **Detalhe do Anúncio**, o botão **"Analisar Preço e Segurança com IA"** abre o diagnóstico instantâneo comparando o item com outros semelhantes na plataforma.
   - Na **Aba de Mensagens**, uma barra de sugestões rápidas permite gerar respostas de negociação contextualizadas ao anúncio em conversa.
4. **Assistente Flutuante Global**:
   - Botão discreto no canto inferior direito que expande uma gaveta rápida de suporte sem tirar o utilizador da página onde está.

### Identidade Visual, Tipografia e Tema
- **Direção Estética**: Utilitário refinado e editorial, alinhado com a identidade do Kuenda Marketplace — superfícies limpas em tons neutros frios (`#F8FAFC` e `#FFFFFF`), divisórias subtis de `1px solid` (`border-slate-200`) e elevação única sem cartões aninhados excessivos.
- **Paleta de Cores (Regra 60-30-10)**:
  - `60%` Superfície Neutra Dominante: Branco puro (`#FFFFFF`) e cinza ardósia claro (`#F8FAFC`).
  - `30%` Estrutura e Tipografia: Ardósia profundo (`#0F172A`) para leitura de alto contraste e bordas estruturais (`#E2E8F0`).
  - `10%` Acento Intencional: Esmeralda Kuenda (`#059669` / `#10B981`) para ações de compra/suporte e Âmbar quente (`#D97706`) para destaques de precificação e alertas de segurança.
- **Hierarquia Tipográfica & Precisão Numérica**:
  - Títulos com equilíbrio ótico (`text-wrap: balance`) e peso SemiBold.
  - Todos os valores monetários em Kwanzas (`Kz`), percentagens de variação de mercado e estatísticas de anúncios utilizam rigorosamente numerais tabulares (`tabular-nums` / `font-mono`) para alinhamento vertical perfeito.
  - Metadados de anúncios e ferramentas renderizados em texto limpo separado por pontos médios (`Categoria · Província · Condição`), sem excesso de etiquetas decorativas.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Arquitetura Spring AI com `@Bean` Tools vs. Prompts Estáticos**
  - *Abordagem Escolhida*: Registo de funções Java anotadas (`@Description`) injetadas no `ChatClient` do Spring AI (`searchMarketplaceCatalog`, `analyzeMarketPriceInKwanzas`, `generateOptimizedListingDraft`, `diagnoseSellerPortfolio`, `suggestChatNegotiationReplies`).
  - *Porquê*: Permite que o modelo consulte o repositório JPA real (`ListingRepository`, `ReviewRepository`) apenas quando necessário, eliminando alucinações sobre preços ou stock e tornando o assistente um verdadeiro consultor de negócios.
  - *Alternativa Rejeitada*: Enviar todo o banco de dados dentro do prompt de sistema (inviável em escala e alto custo de tokens).

- **Decisão 2: Configuração Híbrida Multi-Provedor no Servidor**
  - *Abordagem Escolhida*: Fábrica de configuração Spring AI (`AiProviderConfig`) que seleciona dinamicamente o modelo com base nas variáveis de ambiente (`AI_PROVIDER=GEMINI|OPENAI`, `GEMINI_API_KEY`, `OPENAI_API_KEY`), aliada a um motor determinístico de fallback analítico caso nenhuma chave externa esteja definida em ambiente local de teste.
  - *Porquê*: Garante portabilidade total entre Google Gemini e OpenAI em produção e assegura que os testes unitários e o ambiente de demonstração funcionem 100% do tempo sem falhas.

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Arquitetura e Fluxo de Ferramentas (Spring AI)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        KUENDA FRONTEND (React + TS)                          │
│                                                                              │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │   Aba Dedicada      │  │  Widget Flutuante    │  │ Atalhos Contextuais │  │
│  │     Kuenda AI       │  │   Global (Drawer)    │  │ (Anúncio / Chat)    │  │
│  └──────────┬──────────┘  └──────────┬───────────┘  └──────────┬──────────┘  │
└─────────────┼────────────────────────┼─────────────────────────┼─────────────┘
              │                        │                         │
              └────────────────────────┼─────────────────────────┘
                                       ▼
                        POST /api/ai/chat
                        POST /api/ai/optimize-listing
                        POST /api/ai/price-analysis
                        POST /api/ai/chat-suggestions
                                       │
┌──────────────────────────────────────┼───────────────────────────────────────┐
│                KUENDA BACKEND (Spring Boot + Spring AI)                      │
│                                      ▼                                       │
│                     ┌─────────────────────────────────┐                      │
│                     │       AiAssistantController     │                      │
│                     └────────────────┬────────────────┘                      │
│                                      ▼                                       │
│                     ┌─────────────────────────────────┐                      │
│                     │   AiMarketplaceAssistantService │                      │
│                     │  (Híbrido: Gemini / OpenAI)     │                      │
│                     └────────────────┬────────────────┘                      │
│                                      │ Invocação de Tools (Function Calling) │
│        ┌──────────────────┬──────────┴───────────┬──────────────────┐        │
│        ▼                  ▼                      ▼                  ▼        │
│ ┌──────────────┐  ┌───────────────┐     ┌────────────────┐  ┌──────────────┐ │
│ │ Catalog      │  │ Kwanza Price  │     │ Listing Copy & │  │ Seller Perf &│ │
│ │ Search Tool  │  │ Evaluator Tool│     │ Optimizer Tool │  │ Chat Reply   │ │
│ └──────┬───────┘  └───────┬───────┘     └────────┬───────┘  └──────┬───────┘ │
│        └──────────────────┴──────────┬───────────┴─────────────────┘         │
│                                      ▼                                       │
│                 ┌─────────────────────────────────────────┐                  │
│                 │ JPA Repositories (Listings, Users, Chat)│                  │
│                 └─────────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Dados e Contratos de API
- **Pedido Geral de Assistência (`AiAssistantRequestDTO`)**:
  - `message`: Pergunta ou comando do utilizador.
  - `roleContext`: `'BUYER'` | `'SELLER'` | `'GENERAL'`.
  - `listingId` (opcional): Contexto de um anúncio específico em análise.
  - `chatId` (opcional): Contexto de uma conversa ativa para sugestão de respostas.
  - `history`: Histórico recente de mensagens da sessão para manter o contexto conversacional.
- **Resposta Enriquecida (`AiAssistantResponseDTO`)**:
  - `reply`: Resposta formatada e clara em português.
  - `providerUsed`: Identificador do provedor ativo (`GEMINI`, `OPENAI`, etc.).
  - `toolsExecuted`: Lista de ferramentas acionadas no servidor durante o raciocínio.
  - `priceAnalysis`: Objeto estruturado opcional com `minPriceKz`, `avgPriceKz`, `maxPriceKz`, `verdict` (`ABAIXO_DO_MERCADO`, `PRECO_JUSTO`, `ACIMA_DO_MERCADO`) e `sampleSize`.
  - `optimizedDraft`: Objeto estruturado opcional com `suggestedTitle`, `suggestedDescription`, `suggestedCategory`, `suggestedPriceKz` (pronto para aplicar com 1 clique no formulário de criação de anúncio).
  - `recommendedListings`: Lista de anúncios reais do catálogo correspondentes à intenção do comprador.
  - `suggestedReplies`: Lista de 3 respostas rápidas acionáveis para o chat de negociação.

### Mapeamento Interativo de Estados e Testes Unitários
- **Aplicação com 1 Clique no Modal de Criação**: Quando o vendedor solicita otimização no modal de criação, os campos `title`, `description`, `price` e `category` são preenchidos diretamente no estado do formulário com feedback visual imediato.
- **Avaliação de Oferta no Detalhe do Produto**: Ao clicar em *"Avaliar Preço com IA"*, o painel apresenta a barra comparativa de preços em Kwanzas (Mínimo · Média · Anúncio Atual) e dicas de verificação presencial na província do anúncio.
- **Cobertura de Testes Unitários em Java**: Criação de suites dedicadas (`AiMarketplaceAssistantServiceTest` e `AiAssistantControllerTest`) validando as ferramentas de cálculo de preços, otimização de anúncios, diagnóstico de vendedor, sugestões de chat e segurança dos endpoints REST.
