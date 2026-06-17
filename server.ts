import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const isCjs = typeof require !== 'undefined';
let myDirname = process.cwd();
if (!isCjs) {
  // @ts-ignore
  const __filename = fileURLToPath(import.meta.url);
  myDirname = path.dirname(__filename);
}

const app = express();
const PORT = 3000;

// Enable JSON parsing but with high limit for Base64 image transfers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const DB_FILE = path.join(process.cwd(), 'server-db.json');

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  location: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'novo' | 'excelente' | 'bom_estado' | 'usado';
  location: string;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  status: 'disponivel' | 'vendido';
  createdAt: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
}

interface Chat {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImageUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessageText: string;
  lastMessageTime: string;
}

interface DBStructure {
  users: User[];
  listings: Listing[];
  chats: Chat[];
  messages: Message[];
}

// Initial Mock Seed Data
const initialDB: DBStructure = {
  users: [
    {
      id: "u1",
      name: "João Manuel",
      email: "joao@segundachance.ao",
      password: "123",
      phone: "+244 923 123 456",
      location: "Luanda",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "u2",
      name: "Maria António",
      email: "maria@segundachance.ao",
      password: "123",
      phone: "+244 912 987 654",
      location: "Benguela",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "u3",
      name: "António Carlos",
      email: "antonio@segundachance.ao",
      password: "123",
      phone: "+244 934 555 777",
      location: "Huambo",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString()
    }
  ],
  listings: [
    {
      id: "l1",
      title: "iPhone 12 Pro Max - 256GB Black",
      description: "Vendo iPhone 12 Pro Max em excelente estado, com bateria a 85% de saúde. Inclui cabo original e capa protetora de oferta. Sem riscos no ecrã. Entrego em mãos em Luanda (Talatona ou Kilamba).",
      price: 380000,
      category: "tecnologia",
      condition: "excelente",
      location: "Luanda",
      imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
      sellerId: "u1",
      sellerName: "João Manuel",
      sellerPhone: "+244 923 123 456",
      status: "disponivel",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "l2",
      title: "Sapatilhas Nike Air Force 1 (Originais)",
      description: "Sapatilhas Air Force 1 totalmente novas, tamanho 42. Comprei e ficaram apertadas, nunca foram usadas na rua. Vão na caixa de origem. Ótimo preço para despachar rápido.",
      price: 52000,
      category: "moda",
      condition: "novo",
      location: "Benguela",
      imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
      sellerId: "u2",
      sellerName: "Maria António",
      sellerPhone: "+244 912 987 654",
      status: "disponivel",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "l3",
      title: "Sofá Moderno de 3 Lugares Verde",
      description: "Sofá confortável para sala de estar, estofado a veludo verde. Tem cerca de 1 ano de uso, muito bem cuidado. Estou a vender por mudança de residência. Recolha a cargo do comprador no Lubango.",
      price: 165000,
      category: "casa",
      condition: "bom_estado",
      location: "Huíla (Lubango)",
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
      sellerId: "u2",
      sellerName: "Maria António",
      sellerPhone: "+244 912 987 654",
      status: "disponivel",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "l4",
      title: "Toyota Vitz 2011 - Muito Económico",
      description: "Toyota Vitz com motor 1.0, caixa automática. Ar condicionado a funcionar perfeitamente, rádio Bluetooth. Mecânica impecável, apenas alguns riscos normais do dia-a-dia na pintura. Toda a documentação regularizada.",
      price: 4300000,
      category: "veiculos",
      condition: "usado",
      location: "Luanda",
      imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      sellerId: "u1",
      sellerName: "João Manuel",
      sellerPhone: "+244 923 123 456",
      status: "disponivel",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "l5",
      title: "Bicicleta de Montanha Rockrider",
      description: "Bicicleta em bom estado, ideal para passeios e trilhas. Caixa de 21 velocidades, travões de disco mecânicos e suspensão dianteira. Precisa apenas de uma afinação leve nos travões traseiros.",
      price: 95000,
      category: "desporto",
      condition: "usado",
      location: "Huambo",
      imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
      sellerId: "u3",
      sellerName: "António Carlos",
      sellerPhone: "+244 934 555 777",
      status: "disponivel",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  chats: [
    {
      id: "c1",
      listingId: "l1",
      listingTitle: "iPhone 12 Pro Max - 256GB Black",
      listingPrice: 380000,
      listingImageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
      buyerId: "u2",
      buyerName: "Maria António",
      sellerId: "u1",
      sellerName: "João Manuel",
      lastMessageText: "Combinado! Encontramo-nos no shopping Talatona amanhã às 14h.",
      lastMessageTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ],
  messages: [
    {
      id: "m1",
      chatId: "c1",
      senderId: "u2",
      recipientId: "u1",
      text: "Olá João! O iPhone ainda está disponível para venda?",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "m2",
      chatId: "c1",
      senderId: "u1",
      recipientId: "u2",
      text: "Olá Maria! Sim, ainda está disponível. Tem interesse?",
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "m3",
      chatId: "c1",
      senderId: "u2",
      recipientId: "u1",
      text: "Sim, aceita 360.000 Kz em dinheiro ou transferência por IBAN no ato da entrega?",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "m4",
      chatId: "c1",
      senderId: "u1",
      recipientId: "u2",
      text: "Se for por transferência imediata expressa no momento, aceito sim. Onde podemos combinar?",
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "m5",
      chatId: "c1",
      senderId: "u2",
      recipientId: "u1",
      text: "Combinado! Encontramo-nos no shopping Talatona amanhã às 14h.",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// Database Read/Write Helper
function getDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
      return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler base de dados, a usar dados em memória:", error);
    return initialDB;
  }
}

function saveDB(data: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Erro ao gravar base de dados:", error);
  }
}

// ---------------- API ENDPOINTS ----------------

// 1. REGISTO / LOGIN
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, location } = req.body;
  if (!name || !email || !password || !phone || !location) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const db = getDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está registado' });
  }

  const newUser: User = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    name,
    email: email.toLowerCase(),
    password, // Em produção usaria Bcrypt, mas para simplificação local mantemos plano
    phone,
    location,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    user: userWithoutPassword,
    token: `token_${newUser.id}`
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Insira o e-mail e palavra-passe' });
  }

  const db = getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token: `token_${user.id}`
  });
});

// Helper simple Authorization extractor
const getUserIdFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return null;
  }
  return authHeader.replace('Bearer token_', '');
};

// 2. LISTINGS (ANÚNCIOS)
app.get('/api/listings', (req, res) => {
  const { search, category, location, minPrice, maxPrice, sellerId } = req.query;
  const db = getDB();
  let results = [...db.listings];

  if (search) {
    const term = String(search).toLowerCase();
    results = results.filter(l => 
      l.title.toLowerCase().includes(term) || 
      l.description.toLowerCase().includes(term)
    );
  }

  if (category && category !== 'todos') {
    results = results.filter(l => l.category === category);
  }

  if (location && location !== 'todos') {
    results = results.filter(l => l.location.toLowerCase().includes(String(location).toLowerCase()));
  }

  if (minPrice) {
    results = results.filter(l => l.price >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter(l => l.price <= Number(maxPrice));
  }

  if (sellerId) {
    results = results.filter(l => l.sellerId === sellerId);
  }

  // Sort by newest first
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(results);
});

app.get('/api/listings/:id', (req, res) => {
  const db = getDB();
  const listing = db.listings.find(l => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Anúncio não encontrado' });
  }
  res.json(listing);
});

// Create listing (requires authorization)
app.post('/api/listings', (req, res) => {
  const userId = getUserIdFromHeader(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { title, description, price, category, condition, location, imageUrl } = req.body;
  if (!title || !description || !price || !category || !condition || !location || !imageUrl) {
    return res.status(400).json({ error: 'Todos os campos do anúncio são obrigatórios' });
  }

  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado' });
  }

  const newListing: Listing = {
    id: 'l_' + Math.random().toString(36).substr(2, 9),
    title,
    description,
    price: Number(price),
    category,
    condition,
    location,
    imageUrl, // Can be base64 data URL
    sellerId: user.id,
    sellerName: user.name,
    sellerPhone: user.phone,
    status: 'disponivel',
    createdAt: new Date().toISOString()
  };

  db.listings.push(newListing);
  saveDB(db);

  res.status(201).json(newListing);
});

// Update listing status
app.patch('/api/listings/:id/status', (req, res) => {
  const userId = getUserIdFromHeader(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { status } = req.body;
  if (status !== 'disponivel' && status !== 'vendido') {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const db = getDB();
  const listingIndex = db.listings.findIndex(l => l.id === req.params.id);
  if (listingIndex === -1) {
    return res.status(404).json({ error: 'Anúncio não encontrado' });
  }

  const listing = db.listings[listingIndex];
  if (listing.sellerId !== userId) {
    return res.status(403).json({ error: 'Não tem permissão para alterar este anúncio' });
  }

  db.listings[listingIndex].status = status;
  saveDB(db);

  res.json(db.listings[listingIndex]);
});

// Delete listing
app.delete('/api/listings/:id', (req, res) => {
  const userId = getUserIdFromHeader(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const db = getDB();
  const listingIndex = db.listings.findIndex(l => l.id === req.params.id);
  if (listingIndex === -1) {
    return res.status(404).json({ error: 'Anúncio não encontrado' });
  }

  const listing = db.listings[listingIndex];
  if (listing.sellerId !== userId) {
    return res.status(403).json({ error: 'Não tem permissão para eliminar este anúncio' });
  }

  db.listings.splice(listingIndex, 1);
  saveDB(db);

  res.json({ success: true, message: 'Anúncio eliminado com sucesso' });
});

// 3. MESSAGES & CHATS
// Start or get chat
app.post('/api/chats/start', (req, res) => {
  const buyerId = getUserIdFromHeader(req.headers.authorization);
  if (!buyerId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { listingId } = req.body;
  if (!listingId) {
    return res.status(400).json({ error: 'listingId é obrigatório' });
  }

  const db = getDB();
  const listing = db.listings.find(l => l.id === listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Anúncio não encontrado' });
  }

  if (listing.sellerId === buyerId) {
    return res.status(400).json({ error: 'Não pode iniciar um chat consigo mesmo' });
  }

  const buyer = db.users.find(u => u.id === buyerId);
  if (!buyer) {
    return res.status(404).json({ error: 'Comprador não encontrado' });
  }

  // Check if chat already exists for this listing and buyer
  let chat = db.chats.find(c => c.listingId === listingId && c.buyerId === buyerId);
  
  if (!chat) {
    chat = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      listingImageUrl: listing.imageUrl,
      buyerId: buyer.id,
      buyerName: buyer.name,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      lastMessageText: "Chat iniciado",
      lastMessageTime: new Date().toISOString()
    };
    db.chats.push(chat);
    saveDB(db);
  }

  res.json(chat);
});

// Get all chats of a user
app.get('/api/chats', (req, res) => {
  const userId = getUserIdFromHeader(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const db = getDB();
  const userChats = db.chats.filter(c => c.buyerId === userId || c.sellerId === userId);
  
  // Sort chats by last message time descending
  userChats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  res.json(userChats);
});

// Get messages for a chat
app.get('/api/chats/:id/messages', (req, res) => {
  const userId = getUserIdFromHeader(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const db = getDB();
  const chat = db.chats.find(c => c.id === req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Discussão não encontrada' });
  }

  if (chat.buyerId !== userId && chat.sellerId !== userId) {
    return res.status(403).json({ error: 'Não tem permissão para aceder a esta conversa' });
  }

  const messages = db.messages.filter(m => m.chatId === chat.id);
  // Sort oldest first for chat flow
  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json(messages);
});

// Post a message in a chat
app.post('/api/chats/:id/messages', (req, res) => {
  const senderId = getUserIdFromHeader(req.headers.authorization);
  if (!senderId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'A mensagem não pode estar vazia' });
  }

  const db = getDB();
  const chatIndex = db.chats.findIndex(c => c.id === req.params.id);
  if (chatIndex === -1) {
    return res.status(404).json({ error: 'Conversa não encontrada' });
  }

  const chat = db.chats[chatIndex];
  if (chat.buyerId !== senderId && chat.sellerId !== senderId) {
    return res.status(403).json({ error: 'Não autorizado' });
  }

  const recipientId = chat.buyerId === senderId ? chat.sellerId : chat.buyerId;

  const newMessage: Message = {
    id: 'm_' + Math.random().toString(36).substr(2, 9),
    chatId: chat.id,
    senderId,
    recipientId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);
  
  // Update last message in chat info
  db.chats[chatIndex].lastMessageText = text.trim();
  db.chats[chatIndex].lastMessageTime = newMessage.createdAt;
  
  saveDB(db);

  // Return generated message
  res.status(201).json(newMessage);
});


// Vite middleware integrating config
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global server listening on Port 3000 as required
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SegundaChance Server] Running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Erro ao iniciar o servidor SegundaChance:", err);
});
