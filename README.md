# SegundaChance Angola - Teste Local

Guia passo a passo para configurar e correr a aplicação **SegundaChance Angola** na sua máquina local.

---

## 📋 Requisitos Prévios

Antes de começar, certifique-se de que tem instalado na sua máquina:
*   [Node.js](https://nodejs.org/) (Versão **18.x** ou superior recomendada)
*   [NVM](https://github.com/nvm-sh/nvm) (Opcional, para gerir versões do Node)
*   [NPM](https://www.npmjs.com/) (Vem instalado por padrão com o Node.js)

---

## 🚀 Como Executar Localmente

### 1. Obter o Código-Fonte
Pode exportar o projeto diretamente da plataforma AI Studio:
1.  Clique no menu **Settings** (Configurações) no topo/lateral do AI Studio.
2.  Selecione a opção de **Export as ZIP** para transferir todos os ficheiros do projeto para o seu computador.
3.  Descompacte o ficheiro `.zip` numa pasta à sua escolha.

---

### 2. Instalar as Dependências
Abra o seu terminal na pasta raiz onde descompactou o projeto e execute:
```bash
npm install
```
*Este comando instalará todas as bibliotecas necessárias declaradas no `package.json` (incluindo o React, Express, Vite, Tailwind CSS, Motion, etc.).*

---

### 3. Configurar as Variáveis de Ambiente (Opcional)
Crie um arquivo chamado `.env` na raiz do projeto (copiado do `.env.example`):
```bash
cp .env.example .env
```
Abra o ficheiro `.env` e configure a sua chave da API do Gemini se desejar usufruir de inteligência artificial de classificação rápida no chat backend:
```env
GEMINI_API_KEY="A_SUA_CHAVE_AQUI"
APP_URL="http://localhost:3000"
```

---

### 4. Executar em Modo de Desenvolvimento (Recomendado)
Para iniciar o servidor local com recarregamento em tempo real (Hot Reload):
```bash
npm run dev
```

Após iniciar, o terminal mostrará:
```text
[SegundaChance Server] Running at http://localhost:3000
```
Abra o seu navegador e aceda a **[http://localhost:3000](http://localhost:3000)**. Nova informação criada ou desapegos adicionados serão salvos em segurança na sua máquina.

---

### 5. Compilar e Correr em Modo de Produção
Se pretender testar o comportamento final empacotado da aplicação idêntico à nuvem:
```bash
# 1. Compila o cliente estático do React e o servidor backend para CJS
npm run build

# 2. Inicia o servidor compilado otimizado para produção
npm run start
```

---

## 🗄️ Persistência de Dados Local

A aplicação SegundaChance Angola é **totalmente funcional** e autónoma:
*   Os dados de utilizadores, chats, mensagens e anúncios não desaparecem quando fecha o terminal ou o navegador.
*   O servidor Express escreve e consulta os dados em tempo real num ficheiro chamado **`server-db.json`** criado automaticamente na raiz do seu projeto.
*   **Dica de Teste:** Se desejar limpar todas as alterações e redefinir a base de dados para o estado inicial (com anúncios e utilizadores de simulação limpos), apague o ficheiro `server-db.json`. Ele será recriado com os dados simulados por padrão no próximo arranque!

---

## 📁 Estrutura de Pastas do projeto

```text
├── src/
│   ├── components/       # Interface e Componentes modulares reutilizáveis
│   ├── types.ts          # Definições estritas de tipos do TypeScript
│   ├── index.css         # Estilização global do Tailwind CSS v4
│   └── main.tsx          # Ponto de entrada do React
├── server.ts             # Servidor Backend em NodeJS (Vite middleware + API REST)
├── server-db.json        # Base de dados local em formato JSON (Gerada automaticamente)
├── package.json          # Ficheiro de configuração do ecossistema e scripts
├── PLANO_DE_NEGOCIOS.md  # Plano de Negócios completo para investidores angolanos
└── README.md             # Este guia explicativo
```

---

*SegundaChance Angola — Desapegue com Segurança e Sustentabilidade!*
