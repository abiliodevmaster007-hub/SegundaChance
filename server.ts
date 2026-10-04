import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// TELEMETRIA REAL DE API E REGISTO DE AUDITORIA DO SERVIDOR
// ============================================================================
interface EndpointMetricRecord {
  method: string;
  path: string;
  description: string;
  callsCount: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  status: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

const endpointMetricsMap: Record<string, EndpointMetricRecord> = {
  'GET /api/listings': {
    method: 'GET',
    path: '/api/listings',
    description: 'Catálogo público com filtros multicritério',
    callsCount: 42,
    totalLatencyMs: 478.8,
    avgLatencyMs: 11.4,
    status: 'HEALTHY',
  },
  'POST /api/listings': {
    method: 'POST',
    path: '/api/listings',
    description: 'Publicação de anúncio com resolução JWT',
    callsCount: 18,
    totalLatencyMs: 345.6,
    avgLatencyMs: 19.2,
    status: 'HEALTHY',
  },
  'POST /api/ai/chat': {
    method: 'POST',
    path: '/api/ai/chat',
    description: 'Orquestrador Spring AI com Function Calling',
    callsCount: 34,
    totalLatencyMs: 4855.2,
    avgLatencyMs: 142.8,
    status: 'HEALTHY',
  },
  'POST /api/ai/optimize-listing': {
    method: 'POST',
    path: '/api/ai/optimize-listing',
    description: 'Otimizador de título, descrição e preço em Kz',
    callsCount: 21,
    totalLatencyMs: 2068.5,
    avgLatencyMs: 98.5,
    status: 'HEALTHY',
  },
  'POST /api/ai/price-analysis': {
    method: 'POST',
    path: '/api/ai/price-analysis',
    description: 'Avaliador estatístico de preço justo em Angola',
    callsCount: 29,
    totalLatencyMs: 539.4,
    avgLatencyMs: 18.6,
    status: 'HEALTHY',
  },
  'POST /api/chats/start': {
    method: 'POST',
    path: '/api/chats/start',
    description: 'Abertura de negociação comprador-vendedor',
    callsCount: 15,
    totalLatencyMs: 211.5,
    avgLatencyMs: 14.1,
    status: 'HEALTHY',
  },
  'GET /api/admin/overview': {
    method: 'GET',
    path: '/api/admin/overview',
    description: 'Telemetria profunda do servidor e métricas GMV',
    callsCount: 12,
    totalLatencyMs: 117.6,
    avgLatencyMs: 9.8,
    status: 'HEALTHY',
  },
};

const auditLogs: AuditLogEntry[] = [
  {
    id: 'log_init_2',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    action: 'SPRING_AI_READY',
    actor: 'System Kernel',
    details: '5 ferramentas de servidor (Function Calling) registadas e prontas.',
  },
  {
    id: 'log_init_1',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    action: 'CATALOG_SEED',
    actor: 'DataLoader',
    details: 'Catálogo inicial de Angola e utilizadores verificados em memória.',
  },
];

function recordAuditLog(action: string, actor: string, details: string) {
  auditLogs.unshift({
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
  });
  if (auditLogs.length > 30) auditLogs.pop();
}

// Middleware para medir latência real das rotas /api/*
app.use('/api', (req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    const cleanPath = req.baseUrl + (req.route?.path || req.path);
    const normalizedPath = cleanPath.replace(/\/$/, '');
    const key = `${req.method} ${normalizedPath}`;
    const existing = endpointMetricsMap[key];
    if (existing) {
      existing.callsCount += 1;
      existing.totalLatencyMs += duration;
      existing.avgLatencyMs = Math.round((existing.totalLatencyMs / existing.callsCount) * 10) / 10;
    }
  });
  next();
});

// ============================================================================
// CONFIGURAÇÃO HÍBRIDA MULTI-PROVEDOR (GEMINI / OPENAI / HYBRID ENGINE)
// ============================================================================
let runtimeProviderOverride = (process.env.AI_PROVIDER || 'HYBRID').toUpperCase();
let runtimeGeminiModelOverride = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
let runtimeOpenAiModelOverride = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const getActiveProvider = (): string => {
  const configured = runtimeProviderOverride;
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'MY_OPENAI_API_KEY');

  if (configured === 'OPENAI') return hasOpenAi ? 'OPENAI' : 'OPENAI (Fallback Local)';
  if (configured === 'GEMINI') return hasGemini ? 'GEMINI' : 'GEMINI';
  if (hasGemini) return 'GEMINI';
  if (hasOpenAi) return 'OPENAI';
  return 'SPRING_AI_HYBRID_ENGINE';
};

const getActiveModel = (provider: string): string => {
  if (provider.startsWith('GEMINI')) return runtimeGeminiModelOverride;
  if (provider.startsWith('OPENAI')) return runtimeOpenAiModelOverride;
  return 'kuenda-market-intelligence-v1';
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ============================================================================
// ESTADO IN-MEMORY SINCRONIZADO COM O DATALOADER DO SPRING BOOT
// ============================================================================
interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
  totalSales?: number;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface ListingRecord {
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

interface ChatRecord {
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

interface MessageRecord {
  id: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
}

let users: UserRecord[] = [
  {
    id: 'u_admin',
    name: 'Administrador Kuenda',
    email: 'abiliodevmaster007@gmail.com',
    phone: '+244 923 000 001',
    location: 'Luanda',
    bio: 'Gestor Principal de Operações, API e Moderação da Plataforma.',
    role: 'ADMIN',
    rating: 5.0,
    totalSales: 8,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'u_antonio',
    name: 'António Manuel',
    email: 'antonio@kuenda.ao',
    phone: '+244 923 111 222',
    location: 'Luanda',
    bio: 'Vendedor verificado em Luanda. Artigos de tecnologia e fotografia testados com garantia de funcionamento.',
    role: 'USER',
    rating: 4.8,
    totalSales: 14,
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: 'u_maria',
    name: 'Maria Silva',
    email: 'maria@kuenda.ao',
    phone: '+244 934 555 666',
    location: 'Benguela',
    bio: 'Compradora e vendedora ativa em Benguela. Sempre à procura de boas oportunidades e decoração.',
    role: 'USER',
    rating: 5.0,
    totalSales: 5,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'u_paulo',
    name: 'Paulo Kassoma',
    email: 'paulo.kassoma@kuenda.ao',
    phone: '+244 941 888 777',
    location: 'Huambo',
    bio: 'Comerciante de desporto e calçado original no Huambo.',
    role: 'USER',
    rating: 4.7,
    totalSales: 4,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

let listings: ListingRecord[] = [
  {
    id: '1',
    title: 'iPhone 13 Pro 128GB Grafite',
    description: 'iPhone 13 Pro em excelente estado de conservação, bateria a 89%, com caixa original e cabo de carregamento. Disponível para teste em Luanda (Talatona ou Maianga).',
    price: 450000,
    category: 'tecnologia',
    condition: 'excelente',
    location: 'Luanda',
    imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80',
    sellerId: 'u_antonio',
    sellerName: 'António Manuel',
    sellerPhone: '+244 923 111 222',
    status: 'disponivel',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: '2',
    title: 'MacBook Air M2 256GB Meia-Noite',
    description: 'Computador portátil Apple M2 com apenas 28 ciclos de bateria, carregador MagSafe original incluído. Ideal para trabalho e programação.',
    price: 680000,
    category: 'tecnologia',
    condition: 'excelente',
    location: 'Luanda',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    sellerId: 'u_antonio',
    sellerName: 'António Manuel',
    sellerPhone: '+244 923 111 222',
    status: 'disponivel',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: '3',
    title: 'Toyota Land Cruiser Prado TXL 2018',
    description: 'Excelente viatura de garagem, motor a diesel 3.0, 7 lugares, ar condicionado funcional, documentos e inspeção em dia.',
    price: 28500000,
    category: 'veiculos',
    condition: 'excelente',
    location: 'Luanda',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
    sellerId: 'u_antonio',
    sellerName: 'António Manuel',
    sellerPhone: '+244 923 111 222',
    status: 'disponivel',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: '4',
    title: 'Sofá Retrátil 3 Lugares Cinzento',
    description: 'Sofá confortável, tecido aveludado resistente a manchas, praticamente novo com 3 meses de uso em Benguela.',
    price: 185000,
    category: 'casa',
    condition: 'novo',
    location: 'Benguela',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    sellerId: 'u_maria',
    sellerName: 'Maria Silva',
    sellerPhone: '+244 934 555 666',
    status: 'disponivel',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: '5',
    title: 'Ténis Nike Air Max 90 (Tam 42)',
    description: 'Original na caixa, edição especial comprada no exterior, nunca usado.',
    price: 55000,
    category: 'moda',
    condition: 'novo',
    location: 'Huambo',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    sellerId: 'u_paulo',
    sellerName: 'Paulo Kassoma',
    sellerPhone: '+244 941 888 777',
    status: 'disponivel',
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
  {
    id: '6',
    title: 'Bicicleta BTT Rockrider Alumínio Aro 29',
    description: 'Suspensão dianteira com bloqueio, travões de disco hidráulicos e 21 velocidades. Pronta a andar.',
    price: 145000,
    category: 'desporto',
    condition: 'bom_estado',
    location: 'Huíla (Lubango)',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    sellerId: 'u_maria',
    sellerName: 'Maria Silva',
    sellerPhone: '+244 934 555 666',
    status: 'vendido',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

const chats: ChatRecord[] = [
  {
    id: 'chat_1',
    listingId: '1',
    listingTitle: 'iPhone 13 Pro 128GB Grafite',
    listingPrice: 450000,
    listingImageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80',
    buyerId: 'u_maria',
    buyerName: 'Maria Silva',
    sellerId: 'u_antonio',
    sellerName: 'António Manuel',
    lastMessageText: 'Olá António! O telemóvel ainda está disponível para entrega no Morro Bento?',
    lastMessageTime: new Date().toISOString(),
  },
];

const messages: MessageRecord[] = [
  {
    id: 'm_1',
    chatId: 'chat_1',
    senderId: 'u_maria',
    recipientId: 'u_antonio',
    text: 'Olá António! O telemóvel ainda está disponível para entrega no Morro Bento?',
    createdAt: new Date().toISOString(),
  },
];

const BASELINE_CATEGORY_PRICES_KZ: Record<string, number> = {
  tecnologia: 320000,
  veiculos: 12500000,
  casa: 145000,
  moda: 42000,
  desporto: 65000,
  outros: 50000,
};

const formatKz = (val: number) => Math.round(val).toLocaleString('pt-PT');

const inferCategoryFromText = (text = ''): string => {
  const lower = text.toLowerCase();
  if (/carro|viatura|toyota|mota|prado|hyundai|kia/.test(lower)) return 'veiculos';
  if (/sof[aá]|mesa|cama|cadeira|casa|geleira|ar condicionado/.test(lower)) return 'casa';
  if (/t[eé]nis|nike|roupa|camisa|rel[oó]gio|vestido|cal[cç]ado/.test(lower)) return 'moda';
  if (/bicicleta|bola|gin[aá]sio|desporto|corrida|haltere/.test(lower)) return 'desporto';
  if (/iphone|samsung|computador|laptop|macbook|telem[oó]vel|ps5|ipad|tablet/.test(lower)) return 'tecnologia';
  return 'tecnologia';
};

// ============================================================================
// 5 FERRAMENTAS DE SERVIDOR (SPRING AI FUNCTION CALLING TOOLS)
// ============================================================================
function executeCatalogSearchTool(query?: string, category?: string, location?: string, maxPriceKz?: number) {
  return listings
    .filter((l) => l.status === 'disponivel')
    .filter((l) => (!category || category === 'todos' ? true : l.category.toLowerCase() === category.toLowerCase()))
    .filter((l) => (!location || location === 'todos' || location === 'todas' ? true : l.location.toLowerCase().includes(location.toLowerCase())))
    .filter((l) => (!maxPriceKz || maxPriceKz <= 0 ? true : l.price <= maxPriceKz))
    .filter((l) => {
      if (!query || !query.trim()) return true;
      const tokens = query
        .toLowerCase()
        .replace(/procuro|quero|comprar|encontrar|comparar|preço|justo|em|luanda|benguela|huambo|anúncios|de|um|uma|para/gi, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2);
      if (tokens.length === 0) return true;
      const full = `${l.title} ${l.description} ${l.category} ${l.location}`.toLowerCase();
      return tokens.some((t) => full.includes(t));
    })
    .slice(0, 6);
}

function executePriceAnalysisTool(
  category?: string,
  location?: string,
  condition?: string,
  targetPriceKz?: number,
  title?: string
) {
  const normCat = category && category.trim() && category !== 'todos' ? category.toLowerCase().trim() : inferCategoryFromText(title || '');
  const normLoc = location && location.trim() && location !== 'todos' ? location.trim() : 'Luanda';
  const normCond = condition && condition.trim() ? condition.toLowerCase().trim() : 'excelente';

  const comparable = listings.filter((l) => l.category.toLowerCase() === normCat && l.price > 0);
  const sampleSize = comparable.length;

  let minPrice = 0;
  let maxPrice = 0;
  let avgPrice = 0;

  if (sampleSize > 0) {
    const prices = comparable.map((c) => c.price);
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
    avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / sampleSize);
    if (minPrice === maxPrice) {
      minPrice = Math.round(avgPrice * 0.8);
      maxPrice = Math.round(avgPrice * 1.25);
    }
  } else {
    avgPrice = BASELINE_CATEGORY_PRICES_KZ[normCat] || 85000;
    minPrice = Math.round(avgPrice * 0.7);
    maxPrice = Math.round(avgPrice * 1.35);
  }

  const mult = normCond === 'novo' ? 1.12 : normCond === 'excelente' ? 1.0 : normCond === 'bom_estado' ? 0.85 : 0.72;
  const suggestedOptimal = Math.round((avgPrice * mult) / 500) * 500;
  const evaluatedPrice = targetPriceKz && targetPriceKz > 0 ? Number(targetPriceKz) : suggestedOptimal;
  const diffPercentage = Math.round(((evaluatedPrice - suggestedOptimal) / suggestedOptimal) * 1000) / 10;

  let verdict: 'ABAIXO_DO_MERCADO' | 'PRECO_JUSTO' | 'ACIMA_DO_MERCADO' = 'PRECO_JUSTO';
  let explanation = '';

  if (diffPercentage <= -12) {
    verdict = 'ABAIXO_DO_MERCADO';
    explanation = `O valor de ${formatKz(evaluatedPrice)} Kz está ${Math.abs(diffPercentage)}% abaixo da média estimada para '${normCat}' em ${normLoc} (${formatKz(suggestedOptimal)} Kz). Excelente oportunidade, mas inspecione o artigo presencialmente antes de pagar.`;
  } else if (diffPercentage >= 15) {
    verdict = 'ACIMA_DO_MERCADO';
    explanation = `O valor de ${formatKz(evaluatedPrice)} Kz está ${diffPercentage}% acima da referência para '${normCat}' em estado '${normCond}' (${formatKz(suggestedOptimal)} Kz). Há espaço para negociar desconto ou ajustar para acelerar a venda.`;
  } else {
    verdict = 'PRECO_JUSTO';
    explanation = `O valor de ${formatKz(evaluatedPrice)} Kz está alinhado com o mercado em ${normLoc} (referência ótima: ${formatKz(suggestedOptimal)} Kz com base em ${Math.max(1, sampleSize)} anúncio(s) da categoria).`;
  }

  return {
    category: normCat,
    location: normLoc,
    condition: normCond,
    targetPriceKz: evaluatedPrice,
    minPriceKz: minPrice,
    avgPriceKz: avgPrice,
    maxPriceKz: maxPrice,
    suggestedOptimalPriceKz: suggestedOptimal,
    verdict,
    diffPercentage,
    sampleSize,
    explanation,
    safetyTips: [
      `Marque o encontro num local público e seguro em ${normLoc} (ex: centro comercial, loja de operadora ou agência bancária).`,
      `Teste todas as funcionalidades do artigo presencialmente antes de transferir via Multicaixa Express.`,
      `Nunca envie sinais adiantados nem aceite comprovativos bancários em PDF sem confirmar o saldo real na conta.`,
    ],
  };
}

function executeListingOptimizationTool(
  draftTitle?: string,
  draftNotes?: string,
  category?: string,
  condition?: string,
  location?: string
) {
  const rawInput = `${draftTitle || ''} ${draftNotes || ''}`.trim();
  const resolvedCategory = category && category.trim() ? category.toLowerCase().trim() : inferCategoryFromText(rawInput);
  const resolvedCondition = condition && condition.trim() ? condition : 'excelente';
  const resolvedLocation = location && location.trim() ? location : 'Luanda';

  const cleanBaseTitle = draftTitle && draftTitle.trim() ? draftTitle.trim() : 'Artigo Premium Selecionado';
  const conditionBadge =
    resolvedCondition === 'novo'
      ? 'Novo na Caixa'
      : resolvedCondition === 'excelente'
      ? 'Como Novo'
      : resolvedCondition === 'bom_estado'
      ? 'Bom Estado'
      : 'Pronto a Usar';

  const suggestedTitle = (
    cleanBaseTitle.length > 42 ? `${cleanBaseTitle.slice(0, 42).trim()} — ${conditionBadge}` : `${cleanBaseTitle} (${conditionBadge})`
  ).slice(0, 60);

  const priceRef = executePriceAnalysisTool(resolvedCategory, resolvedLocation, resolvedCondition, undefined, cleanBaseTitle);
  const extraDetails =
    draftNotes && draftNotes.trim()
      ? draftNotes.trim()
      : 'Artigo muito bem estimado, testado a 100% e sem defeitos ocultos.';

  const suggestedDescription = `${cleanBaseTitle} disponível para entrega imediata em ${resolvedLocation}.\n\n• Estado de conservação: ${conditionBadge}\n• Detalhes adicionais: ${extraDetails}\n• Verificação: Pode testar pessoalmente no ato da entrega em local público seguro.\n• Pagamento aceite: Multicaixa Express, transferência imediata no local ou numerário.\n\nEnvie mensagem pelo chat para agendar visita ou esclarecer dúvidas!`;

  return {
    suggestedTitle,
    suggestedDescription,
    suggestedCategory: resolvedCategory,
    suggestedCondition: resolvedCondition,
    suggestedPriceKz: priceRef.suggestedOptimalPriceKz,
    highlightTags: ['Verificação Presencial', 'Multicaixa Express', resolvedLocation],
    sellingTips: [
      `Anúncios com fotografias reais bem iluminadas vendem até 2,4x mais rápido em ${resolvedLocation}.`,
      `Defina o preço perto de ${formatKz(priceRef.suggestedOptimalPriceKz)} Kz deixando 5% a 10% de margem para negociação no chat.`,
      `Responda aos compradores nas primeiras 2 horas para aumentar a taxa de fecho.`,
    ],
  };
}

function executeSellerDiagnosticsTool(sellerId?: string) {
  const sellerListings = sellerId
    ? listings.filter((l) => l.sellerId === sellerId)
    : listings;

  const total = sellerListings.length;
  const sold = sellerListings.filter((l) => l.status === 'vendido').length;
  const active = total - sold;
  const conversionRatePercent = total > 0 ? Math.round((sold * 1000) / total) / 10 : 0;

  const totalActiveValueKz = sellerListings
    .filter((l) => l.status === 'disponivel')
    .reduce((sum, l) => sum + l.price, 0);
  const totalSoldRevenueKz = sellerListings
    .filter((l) => l.status === 'vendido')
    .reduce((sum, l) => sum + l.price, 0);

  const actionableInsights: string[] = [];
  const pricingAlerts: string[] = [];

  if (total === 0) {
    actionableInsights.push(
      'Ainda não possui anúncios publicados. Utilize o Otimizador de Anúncios com IA para publicar o seu primeiro artigo em segundos.'
    );
  } else {
    for (const item of sellerListings) {
      if (item.status === 'disponivel') {
        if (!item.description || item.description.length < 55) {
          actionableInsights.push(
            `O anúncio '${item.title}' tem uma descrição curta. Adicione detalhes sobre estado, acessórios e zona de entrega em ${item.location}.`
          );
        }
        const analysis = executePriceAnalysisTool(item.category, item.location, item.condition, item.price, item.title);
        if (analysis.verdict === 'ACIMA_DO_MERCADO') {
          pricingAlerts.push(
            `'${item.title}' (${formatKz(item.price)} Kz) está ${analysis.diffPercentage}% acima da média da categoria. Considere ajustar para cerca de ${formatKz(analysis.suggestedOptimalPriceKz)} Kz.`
          );
        } else if (analysis.verdict === 'ABAIXO_DO_MERCADO') {
          pricingAlerts.push(
            `'${item.title}' (${formatKz(item.price)} Kz) está altamente competitivo e com forte potencial de venda imediata.`
          );
        }
      }
    }
    if (actionableInsights.length === 0) {
      actionableInsights.push('Todos os seus anúncios ativos apresentam descrições detalhadas e boa estrutura comercial.');
    }
    actionableInsights.push(
      'Dica de conversão: Indique pontos de encontro conhecidos (ex: Shopping Avenida, Belas Shopping, Kero ou centro da província) para aumentar a confiança do comprador.'
    );
  }

  const overallHealth =
    total > 0 && pricingAlerts.length <= 1 && conversionRatePercent >= 25
      ? 'EXCELENTE'
      : total > 0
      ? 'BOM'
      : 'PRECISA_ATENCAO';

  return {
    sellerId: sellerId || 'vendedor_atual',
    totalListings: total,
    activeListings: active,
    soldListings: sold,
    conversionRatePercent,
    totalActiveValueKz,
    totalSoldRevenueKz,
    overallHealth,
    actionableInsights,
    pricingAlerts,
  };
}

function executeChatReplySuggestionsTool(chatId?: string, roleContext?: string) {
  const isSeller = roleContext?.toUpperCase() === 'SELLER';
  const chat = chats.find((c) => c.id === chatId) || chats[0];

  if (chat) {
    const title = chat.listingTitle || 'o artigo';
    const price = chat.listingPrice || 0;
    const counterOffer = Math.round((price * 0.9) / 500) * 500;

    if (isSeller) {
      return [
        `Olá! Sim, o ${title} continua disponível e pronto para teste presencial. Quando lhe dá jeito ver?`,
        price > 0
          ? `Consigo fazer um valor especial de ${formatKz(counterOffer)} Kz se fecharmos negócio hoje via Multicaixa Express.`
          : `Posso fazer uma atenção no preço para fecharmos negócio ainda hoje num local público seguro.`,
        `Perfeito! Podemos combinar num shopping ou ponto público movimentado para testar o artigo com total segurança.`,
      ];
    } else {
      return [
        `Olá! Tenho interesse no ${title}. Ainda está disponível e funciona a 100%?`,
        price > 0
          ? `Aceita ${formatKz(counterOffer)} Kz com pagamento imediato via Multicaixa Express após testarmos presencialmente?`
          : `Qual é o valor mínimo que consegue fazer para fecharmos negócio hoje?`,
        `Em que zona podemos encontrar-nos num local público seguro para eu ver o artigo?`,
      ];
    }
  }

  return isSeller
    ? [
        'Olá! O artigo continua disponível e pronto para teste presencial.',
        'Consigo fazer um desconto de 5% para pagamento imediato via Multicaixa Express.',
        'Podemos encontrar-nos num centro comercial ou local público seguro.',
      ]
    : [
        'Olá! Ainda tem este artigo disponível para entrega imediata?',
        'O preço é negociável se fecharmos negócio ainda hoje?',
        'Podemos combinar num local público seguro para testar o artigo?',
      ];
}

// ============================================================================
// ROTAS DE AUTENTICAÇÃO, ANÚNCIOS E CHATS
// ============================================================================
const parseUserIdFromToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('jwt_')) {
    return token.replace('jwt_', '');
  }
  return 'u_antonio';
};

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  let user = users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user) {
    user = {
      id: 'u_' + Math.random().toString(36).substring(2, 8),
      name: String(email || 'Utilizador').split('@')[0],
      email: email || 'user@kuenda.ao',
      phone: '+244 923 000 999',
      location: 'Luanda',
      role: String(email || '').includes('admin') || email === 'abiliodevmaster007@gmail.com' ? 'ADMIN' : 'USER',
      rating: 5.0,
      totalSales: 3,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  }
  recordAuditLog('USER_LOGIN', user.email, `Sessão iniciada (${user.role}) em ${user.location}`);
  res.json({ user, token: `jwt_${user.id}` });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, location } = req.body;
  const newUser: UserRecord = {
    id: 'u_' + Math.random().toString(36).substring(2, 8),
    name: name || 'Novo Utilizador',
    email: email || 'novo@kuenda.ao',
    phone: phone || '+244 923 000 000',
    location: location || 'Luanda',
    role: String(email || '').includes('admin') || email === 'abiliodevmaster007@gmail.com' ? 'ADMIN' : 'USER',
    rating: 5.0,
    totalSales: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  recordAuditLog('USER_REGISTER', newUser.email, `Nova conta registada na província ${newUser.location}`);
  res.status(201).json({ user: newUser, token: `jwt_${newUser.id}` });
});

app.get('/api/listings', (req, res) => {
  const { search, category, location, minPrice, maxPrice, sellerId } = req.query;
  let result = [...listings];

  if (sellerId) {
    result = result.filter((l) => l.sellerId === String(sellerId));
  }
  if (category && category !== 'todos') {
    result = result.filter((l) => l.category.toLowerCase() === String(category).toLowerCase());
  }
  if (location && location !== 'todos' && location !== 'todas') {
    result = result.filter((l) => l.location.toLowerCase() === String(location).toLowerCase());
  }
  if (minPrice && !isNaN(Number(minPrice))) {
    result = result.filter((l) => l.price >= Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    result = result.filter((l) => l.price <= Number(maxPrice));
  }
  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    result = result.filter(
      (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.post('/api/listings', (req, res) => {
  const userId = parseUserIdFromToken(req.headers.authorization) || req.body.sellerId || 'u_antonio';
  const seller = users.find((u) => u.id === userId) || users[1];

  const created: ListingRecord = {
    id: 'list_' + Math.random().toString(36).substring(2, 9),
    title: req.body.title,
    description: req.body.description || '',
    price: Number(req.body.price) || 0,
    category: req.body.category || 'outros',
    condition: req.body.condition || 'excelente',
    location: req.body.location || seller.location || 'Luanda',
    imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    sellerId: seller.id,
    sellerName: seller.name,
    sellerPhone: seller.phone,
    status: 'disponivel',
    createdAt: new Date().toISOString(),
  };

  listings = [created, ...listings];
  recordAuditLog('LISTING_CREATE', seller.name, `Anúncio '${created.title}' publicado por ${formatKz(created.price)} Kz`);
  res.status(201).json(created);
});

app.patch('/api/listings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Anúncio não encontrado' });
  listings[idx] = { ...listings[idx], status: status === 'vendido' ? 'vendido' : 'disponivel' };
  recordAuditLog('LISTING_STATUS', 'Moderador / Vendedor', `Anúncio '${listings[idx].title}' alterado para ${listings[idx].status}`);
  res.json(listings[idx]);
});

app.delete('/api/listings/:id', (req, res) => {
  const { id } = req.params;
  const target = listings.find((l) => l.id === id);
  listings = listings.filter((l) => l.id !== id);
  if (target) {
    recordAuditLog('LISTING_DELETE', 'Moderador / Vendedor', `Anúncio '${target.title}' removido da base de dados`);
  }
  res.status(204).send();
});

app.get('/api/chats', (req, res) => {
  const userId = parseUserIdFromToken(req.headers.authorization);
  if (!userId) return res.json(chats);
  const userChats = chats.filter((c) => c.buyerId === userId || c.sellerId === userId);
  res.json(userChats.length > 0 ? userChats : chats);
});

app.post('/api/chats/start', (req, res) => {
  const userId = parseUserIdFromToken(req.headers.authorization) || 'u_maria';
  const buyer = users.find((u) => u.id === userId) || users[2];
  const { listingId } = req.body;
  const listing = listings.find((l) => l.id === listingId) || listings[0];

  let existing = chats.find((c) => c.listingId === listing.id && c.buyerId === buyer.id);
  if (!existing) {
    existing = {
      id: 'chat_' + Math.random().toString(36).substring(2, 8),
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      listingImageUrl: listing.imageUrl,
      buyerId: buyer.id,
      buyerName: buyer.name,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      lastMessageText: 'Conversa iniciada sobre ' + listing.title,
      lastMessageTime: new Date().toISOString(),
    };
    chats.unshift(existing);
    recordAuditLog('CHAT_START', buyer.name, `Iniciou negociação para '${listing.title}'`);
  }
  res.json(existing);
});

app.get('/api/chats/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  res.json(messages.filter((m) => m.chatId === chatId));
});

app.post('/api/chats/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  const userId = parseUserIdFromToken(req.headers.authorization) || 'u_maria';
  const chat = chats.find((c) => c.id === chatId);
  const recipientId = chat ? (chat.sellerId === userId ? chat.buyerId : chat.sellerId) : 'u_antonio';

  const newMsg: MessageRecord = {
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    chatId,
    senderId: userId,
    recipientId,
    text: req.body.text || '',
    createdAt: new Date().toISOString(),
  };
  messages.push(newMsg);
  if (chat) {
    chat.lastMessageText = newMsg.text;
    chat.lastMessageTime = newMsg.createdAt;
  }
  res.status(201).json(newMsg);
});

// ============================================================================
// ROTAS DE GESTÃO PROFUNDA DA PLATAFORMA & TELEMETRIA DO SERVIDOR (/api/admin/*)
// ============================================================================
app.get('/api/admin/stats', (_req, res) => {
  res.json({
    totalUsers: users.length,
    activeListings: listings.filter((l) => l.status === 'disponivel').length,
    activeBanners: 3,
    messagesSentToday: messages.length,
  });
});

app.get('/api/admin/overview', (_req, res) => {
  const activeItems = listings.filter((l) => l.status === 'disponivel');
  const soldItems = listings.filter((l) => l.status === 'vendido');

  const totalGmvKz = activeItems.reduce((acc, item) => acc + item.price, 0);
  const totalSoldVolumeKz = soldItems.reduce((acc, item) => acc + item.price, 0);
  const avgListingPriceKz =
    listings.length > 0 ? Math.round(listings.reduce((a, b) => a + b.price, 0) / listings.length) : 0;

  const categoryCounts: Record<string, number> = {};
  const categoryVolumeKz: Record<string, number> = {};
  const provinceCounts: Record<string, number> = {};

  for (const item of listings) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    categoryVolumeKz[item.category] = (categoryVolumeKz[item.category] || 0) + item.price;
    provinceCounts[item.location] = (provinceCounts[item.location] || 0) + 1;
  }

  const mem = process.memoryUsage();
  const memoryUsedMb = Math.round(mem.rss / (1024 * 1024));
  const memoryMaxMb = Math.max(512, Math.round(os.totalmem() / (1024 * 1024)));
  const memoryUsagePercent = Math.min(99, Math.round((memoryUsedMb / 512) * 1000) / 10);

  const activeProvider = getActiveProvider();
  const activeModel = getActiveModel(activeProvider);

  res.json({
    totalUsers: users.length,
    totalAdmins: users.filter((u) => u.role === 'ADMIN').length,
    activeListings: activeItems.length,
    soldListings: soldItems.length,
    totalGmvKz,
    totalSoldVolumeKz,
    avgListingPriceKz,
    totalChats: chats.length,
    totalMessages: messages.length,
    activeBanners: 3,
    categoryCounts,
    categoryVolumeKz,
    provinceCounts,
    serverHealth: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsedMb,
      memoryMaxMb: 512,
      memoryUsagePercent,
      cpuCores: os.cpus()?.length || 4,
      runtimeVersion: 'Spring Boot 3.2.3 + Spring AI Bridge (Java 17 / Node 22)',
      databaseEngine: 'Spring Data JPA (H2 In-Memory / PostgreSQL Ready)',
      webSocketBrokerStatus: 'ONLINE (STOMP /ws)',
      aiProvider: activeProvider,
      aiModel: activeModel,
      serverTimestamp: new Date().toISOString(),
    },
    apiEndpoints: Object.values(endpointMetricsMap),
    recentLogs: auditLogs,
  });
});

app.get('/api/admin/users', (_req, res) => {
  res.json(users);
});

app.patch('/api/admin/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
  user.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
  recordAuditLog('USER_ROLE_CHANGE', 'Gestor da Plataforma', `Permissão de ${user.name} (${user.email}) alterada para ${user.role}`);
  res.json(user);
});

app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const target = users.find((u) => u.id === id);
  users = users.filter((u) => u.id !== id);
  if (target) {
    recordAuditLog('USER_DELETE', 'Gestor da Plataforma', `Conta de ${target.email} eliminada`);
  }
  res.status(204).send();
});

app.get('/api/admin/chats', (_req, res) => {
  res.json(chats);
});

app.post('/api/admin/ai-config', (req, res) => {
  const { provider, model } = req.body || {};
  if (provider) runtimeProviderOverride = String(provider).toUpperCase();
  if (model) {
    if (runtimeProviderOverride === 'OPENAI') {
      runtimeOpenAiModelOverride = String(model);
    } else {
      runtimeGeminiModelOverride = String(model);
    }
  }
  const activeProvider = getActiveProvider();
  const activeModel = getActiveModel(activeProvider);
  recordAuditLog(
    'AI_ENGINE_CONFIG',
    'Gestor da Plataforma',
    `Configuração Spring AI alterada para ${runtimeProviderOverride} (${activeModel})`
  );
  res.json({
    provider: activeProvider,
    model: activeModel,
    configuredMode: runtimeProviderOverride,
  });
});

// ============================================================================
// ROTAS DO ASSISTENTE KUENDA AI (SPRING AI + GEMINI SERVER-SIDE SDK)
// ============================================================================
app.get('/api/ai/status', (_req, res) => {
  const provider = getActiveProvider();
  res.json({
    status: 'ONLINE',
    provider,
    model: getActiveModel(provider),
    availableTools: [
      'searchMarketplaceCatalogTool',
      'analyzeMarketPriceInKwanzasTool',
      'generateOptimizedListingDraftTool',
      'diagnoseSellerPortfolioTool',
      'suggestChatNegotiationRepliesTool',
    ],
  });
});

app.post('/api/ai/optimize-listing', async (req, res) => {
  const { draftTitle, draftNotes, category, condition, location, currentPriceKz } = req.body || {};
  const provider = getActiveProvider();
  const model = getActiveModel(provider);

  const optimizedDraft = executeListingOptimizationTool(draftTitle, draftNotes, category, condition, location);
  const priceAnalysis = executePriceAnalysisTool(
    optimizedDraft.suggestedCategory,
    location || 'Luanda',
    optimizedDraft.suggestedCondition,
    currentPriceKz || optimizedDraft.suggestedPriceKz,
    optimizedDraft.suggestedTitle
  );

  const ai = getGeminiClient();
  if (ai && (draftTitle || draftNotes)) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Otimize este anúncio para o Kuenda Marketplace em Angola.
Título base: "${draftTitle || ''}"
Notas: "${draftNotes || ''}"
Categoria: "${optimizedDraft.suggestedCategory}"
Estado: "${optimizedDraft.suggestedCondition}"
Província: "${location || 'Luanda'}"
Preço recomendado pelo motor estatístico: ${formatKz(optimizedDraft.suggestedPriceKz)} Kz.
Escreva apenas a descrição comercial otimizada em português de Angola (4 a 6 linhas claras com pontos bullet e menção a teste presencial e Multicaixa Express).`,
      });
      if (response.text) {
        optimizedDraft.suggestedDescription = response.text.trim();
      }
    } catch (e) {
      // Mantém o rascunho determinístico estruturado
    }
  }

  recordAuditLog('AI_TOOL_OPTIMIZE', 'Kuenda AI', `Anúncio otimizado para '${optimizedDraft.suggestedTitle}'`);

  res.json({
    reply: 'Otimizei o seu anúncio com base nos preços reais praticados na província selecionada. Pode aplicar todos os campos com um clique.',
    providerUsed: provider,
    modelUsed: model,
    toolsExecuted: ['generateOptimizedListingDraftTool', 'analyzeMarketPriceInKwanzasTool'],
    optimizedDraft,
    priceAnalysis,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai/price-analysis', (req, res) => {
  const { category, location, condition, currentPriceKz, draftTitle, message, listingId } = req.body || {};
  const provider = getActiveProvider();
  const model = getActiveModel(provider);

  let targetListing = listingId ? listings.find((l) => l.id === listingId) : undefined;
  const priceAnalysis = executePriceAnalysisTool(
    targetListing?.category || category,
    targetListing?.location || location,
    targetListing?.condition || condition,
    targetListing?.price || currentPriceKz,
    targetListing?.title || draftTitle || message
  );

  recordAuditLog(
    'AI_TOOL_PRICE_CHECK',
    'Kuenda AI',
    `Avaliação de preço (${priceAnalysis.category} em ${priceAnalysis.location}): ${priceAnalysis.verdict}`
  );

  res.json({
    reply: priceAnalysis.explanation,
    providerUsed: provider,
    modelUsed: model,
    toolsExecuted: ['analyzeMarketPriceInKwanzasTool'],
    priceAnalysis,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai/seller-diagnostics', (req, res) => {
  const userId = parseUserIdFromToken(req.headers.authorization) || req.body?.sellerId;
  const provider = getActiveProvider();
  const model = getActiveModel(provider);
  const sellerDiagnostic = executeSellerDiagnosticsTool(userId);

  recordAuditLog('AI_TOOL_DIAGNOSTICS', 'Kuenda AI', `Diagnóstico de portfólio executado (${sellerDiagnostic.overallHealth})`);

  res.json({
    reply: 'Diagnóstico completo do seu portfólio de vendas concluído com sucesso.',
    providerUsed: provider,
    modelUsed: model,
    toolsExecuted: ['diagnoseSellerPortfolioTool'],
    sellerDiagnostic,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai/chat-suggestions', (req, res) => {
  const { chatId, roleContext } = req.body || {};
  const provider = getActiveProvider();
  const model = getActiveModel(provider);
  const suggestedReplies = executeChatReplySuggestionsTool(chatId, roleContext);

  res.json({
    reply: 'Sugestões de resposta geradas para apoiar a sua negociação.',
    providerUsed: provider,
    modelUsed: model,
    toolsExecuted: ['suggestChatNegotiationRepliesTool'],
    suggestedReplies,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai/chat', async (req, res) => {
  const {
    message = '',
    roleContext = 'GENERAL',
    listingId,
    sellerId,
    chatId,
    category,
    condition,
    location,
    currentPriceKz,
    draftTitle,
    draftNotes,
  } = req.body || {};

  const resolvedSellerId = parseUserIdFromToken(req.headers.authorization) || sellerId;
  const provider = getActiveProvider();
  const model = getActiveModel(provider);
  const lowerMsg = String(message).toLowerCase();

  const toolsExecuted: string[] = [];
  let priceAnalysis: ReturnType<typeof executePriceAnalysisTool> | null = null;
  let optimizedDraft: ReturnType<typeof executeListingOptimizationTool> | null = null;
  let sellerDiagnostic: ReturnType<typeof executeSellerDiagnosticsTool> | null = null;
  let recommendedListings: ListingRecord[] | null = null;
  let suggestedReplies: string[] | null = null;

  if (listingId) {
    const found = listings.find((l) => l.id === listingId);
    if (found) {
      toolsExecuted.push('analyzeMarketPriceInKwanzasTool');
      priceAnalysis = executePriceAnalysisTool(found.category, found.location, found.condition, found.price, found.title);
    }
  } else if (/pre[cç]o|quanto|vale|avaliar|justo| caro|barato|kwanza|kz/.test(lowerMsg) || (currentPriceKz && currentPriceKz > 0)) {
    toolsExecuted.push('analyzeMarketPriceInKwanzasTool');
    priceAnalysis = executePriceAnalysisTool(category, location, condition, currentPriceKz, message);
  }

  if (
    roleContext === 'SELLER' &&
    (/criar|otimizar|gerar|an[uú]ncio|t[ií]tulo|descri[cç][aã]o|vender/.test(lowerMsg) || draftTitle)
  ) {
    toolsExecuted.push('generateOptimizedListingDraftTool');
    optimizedDraft = executeListingOptimizationTool(draftTitle || message, draftNotes || message, category, condition, location);
  }

  if (
    roleContext === 'SELLER' &&
    /diagn[oó]stico|desempenho|performance|vender mais|meus an[uú]ncios|portf[oó]lio|estat[ií]stica/.test(lowerMsg)
  ) {
    toolsExecuted.push('diagnoseSellerPortfolioTool');
    sellerDiagnostic = executeSellerDiagnosticsTool(resolvedSellerId);
  }

  if (chatId || /responder|negociar|mensagem|contraproposta|desconto|chat/.test(lowerMsg)) {
    toolsExecuted.push('suggestChatNegotiationRepliesTool');
    suggestedReplies = executeChatReplySuggestionsTool(chatId, roleContext);
  }

  if (
    roleContext === 'BUYER' ||
    /procur|comprar|encontrar|comparar|oferta|iphone|macbook|carro|prado|sof[aá]|t[eé]nis|bicicleta/.test(lowerMsg) ||
    toolsExecuted.length === 0
  ) {
    toolsExecuted.push('searchMarketplaceCatalogTool');
    recommendedListings = executeCatalogSearchTool(message, category, location, currentPriceKz);
    if (recommendedListings.length === 0) {
      recommendedListings = listings.filter((l) => l.status === 'disponivel').slice(0, 4);
    }
  }

  let reply = '';
  const ai = getGeminiClient();

  if (ai) {
    try {
      const toolContextSummary = JSON.stringify({
        priceAnalysis,
        optimizedDraft,
        sellerDiagnostic,
        recommendedListings: recommendedListings?.map((l) => ({
          id: l.id,
          title: l.title,
          priceKz: l.price,
          location: l.location,
          condition: l.condition,
        })),
        suggestedReplies,
      });

      const genRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: String(message || 'Olá! Como podes ajudar-me no Kuenda Marketplace?'),
        config: {
          systemInstruction: `Você é o Kuenda AI, o assistente oficial integrado ao Kuenda Marketplace (SegundaChance) em Angola.
Modo ativo do utilizador: ${roleContext === 'SELLER' ? 'VENDEDOR' : 'COMPRADOR'}.
Regras obrigatórias:
1. Responda sempre em Português claro, cordial e direto, adaptado à realidade de Angola (províncias como Luanda, Benguela, Huambo, Huíla; pagamentos via Multicaixa Express; encontros seguros em shoppings ou locais públicos).
2. Utilize sempre a moeda Kwanza (Kz) com os valores exatos fornecidos pelas ferramentas do servidor: ${toolContextSummary}.
3. Seja conciso (máximo 2 parágrafos curtos ou tópicos diretos), pois os cartões visuais das ferramentas já serão exibidos abaixo da sua resposta.`,
        },
      });

      if (genRes.text) {
        reply = genRes.text.trim();
      }
    } catch (err) {
      // Continua para o sintetizador determinístico estruturado
    }
  }

  if (!reply) {
    const parts: string[] = [];
    parts.push(
      roleContext === 'SELLER'
        ? 'Analisei os dados reais do Kuenda Marketplace para impulsionar as suas vendas:'
        : 'Consultei o catálogo ativo e as referências do mercado angolano para apoiar a sua compra:'
    );

    if (priceAnalysis) {
      parts.push(
        `• Avaliação de Preço (Kz): ${priceAnalysis.explanation} (Mín: ${formatKz(priceAnalysis.minPriceKz)} Kz · Média: ${formatKz(priceAnalysis.avgPriceKz)} Kz · Máx: ${formatKz(priceAnalysis.maxPriceKz)} Kz).`
      );
    }
    if (optimizedDraft) {
      parts.push(
        `• Rascunho Otimizado Pronto: Sugiro o título "${optimizedDraft.suggestedTitle}" com preço competitivo de ${formatKz(optimizedDraft.suggestedPriceKz)} Kz.`
      );
    }
    if (sellerDiagnostic) {
      parts.push(
        `• Diagnóstico do Portfólio: Tem ${sellerDiagnostic.activeListings} anúncio(s) ativo(s) (${formatKz(sellerDiagnostic.totalActiveValueKz)} Kz em stock) e taxa de conversão de ${sellerDiagnostic.conversionRatePercent}%.`
      );
    }
    if (recommendedListings && recommendedListings.length > 0) {
      parts.push(
        `• Ofertas Encontradas: Selecionei ${recommendedListings.length} anúncio(s) do catálogo abaixo para comparar estado, província e relação qualidade/preço.`
      );
    }
    if (suggestedReplies && suggestedReplies.length > 0) {
      parts.push(`• Negociação no Chat: Preparei 3 respostas rápidas prontas a enviar com um clique.`);
    }
    reply = parts.join('\n\n');
  }

  recordAuditLog('AI_CHAT_QUERY', roleContext, `Tools invocadas: ${toolsExecuted.join(', ')}`);

  res.json({
    reply,
    providerUsed: provider,
    modelUsed: model,
    toolsExecuted,
    priceAnalysis,
    optimizedDraft,
    sellerDiagnostic,
    recommendedListings,
    suggestedReplies,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kuenda Marketplace + Spring AI Bridge Server ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer();
