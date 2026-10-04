export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number; // Ex: 4.8
  totalSales?: number; // Ex: 12
  role?: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'lateral' | 'topo';
  active: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeListings: number;
  activeBanners: number;
  messagesSentToday: number;
}

// ============================================================================
// TIPOS DO PAINEL CENTRAL DE GESTOR DA PLATAFORMA & TELEMETRIA BACKEND
// ============================================================================
export interface ServerHealthMetrics {
  uptimeSeconds: number;
  memoryUsedMb: number;
  memoryMaxMb: number;
  memoryUsagePercent: number;
  cpuCores: number;
  runtimeVersion: string;
  databaseEngine: string;
  webSocketBrokerStatus: string;
  aiProvider: string;
  aiModel: string;
  serverTimestamp: string;
}

export interface EndpointMetric {
  method: string;
  path: string;
  description: string;
  callsCount: number;
  avgLatencyMs: number;
  status: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface PlatformManagementOverview {
  totalUsers: number;
  totalAdmins: number;
  activeListings: number;
  soldListings: number;
  totalGmvKz: number;
  totalSoldVolumeKz: number;
  avgListingPriceKz: number;
  totalChats: number;
  totalMessages: number;
  activeBanners: number;
  categoryCounts: Record<string, number>;
  categoryVolumeKz: Record<string, number>;
  provinceCounts: Record<string, number>;
  serverHealth: ServerHealthMetrics;
  apiEndpoints: EndpointMetric[];
  recentLogs: AuditLogEntry[];
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'novo' | 'excelente' | 'bom_estado' | 'usado';
  location: string; // e.g., "Luanda", "Benguela"
  imageUrl: string; // Base64 or URL
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  status: 'disponivel' | 'vendido';
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
}

export interface Chat {
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

// ============================================================================
// TIPOS DO ECOSSISTEMA KUENDA AI (SPRING AI & FUNCTION CALLING)
// ============================================================================
export interface AiPriceAnalysis {
  category: string;
  location: string;
  condition: string;
  targetPriceKz: number;
  minPriceKz: number;
  avgPriceKz: number;
  maxPriceKz: number;
  suggestedOptimalPriceKz: number;
  verdict: 'ABAIXO_DO_MERCADO' | 'PRECO_JUSTO' | 'ACIMA_DO_MERCADO';
  diffPercentage: number;
  sampleSize: number;
  explanation: string;
  safetyTips: string[];
}

export interface AiOptimizedListingDraft {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory: string;
  suggestedCondition: string;
  suggestedPriceKz: number;
  highlightTags: string[];
  sellingTips: string[];
}

export interface AiSellerDiagnostic {
  sellerId: string;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  conversionRatePercent: number;
  totalActiveValueKz: number;
  totalSoldRevenueKz: number;
  overallHealth: 'EXCELENTE' | 'BOM' | 'PRECISA_ATENCAO';
  actionableInsights: string[];
  pricingAlerts: string[];
}

export interface AiAssistantResponse {
  reply: string;
  providerUsed: string;
  modelUsed: string;
  toolsExecuted: string[];
  priceAnalysis?: AiPriceAnalysis | null;
  optimizedDraft?: AiOptimizedListingDraft | null;
  sellerDiagnostic?: AiSellerDiagnostic | null;
  recommendedListings?: Listing[] | null;
  suggestedReplies?: string[] | null;
  timestamp: string;
}

export interface AiConversationEntry {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  roleContext: 'BUYER' | 'SELLER';
  responseMeta?: AiAssistantResponse;
  createdAt: string;
}

export interface ListingPrefillData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location?: string;
}

export const ANGOLA_PROVINCES = [
  'Luanda',
  'Benguela',
  'Huambo',
  'Huíla (Lubango)',
  'Cabinda',
  'Malanje',
  'Namibe',
  'Uíge',
  'Cuanza Sul',
  'Zaire (Soyo)',
  'Lunda Norte',
  'Lunda Sul',
  'Bengo',
  'Bié',
  'Cuando Cubango',
  'Cunene',
  'Moxico',
  'Cuanza Norte'
];

export const CATEGORIES = [
  { id: 'tecnologia', label: 'Telemóveis & Tecnologia', icon: 'Smartphone' },
  { id: 'moda', label: 'Moda & Calçado', icon: 'Shirt' },
  { id: 'casa', label: 'Casa & Decoração', icon: 'Home' },
  { id: 'veiculos', label: 'Carros & Motas', icon: 'Car' },
  { id: 'desporto', label: 'Desporto & Lazer', icon: 'Activity' },
  { id: 'outros', label: 'Outros Artigos', icon: 'Layers' }
];

export const CONDITIONS = [
  { id: 'novo', label: 'Novo (Nunca usado)' },
  { id: 'excelente', label: 'Excelente (Como novo)' },
  { id: 'bom_estado', label: 'Bom Estado (Sinais de uso ligeiros)' },
  { id: 'usado', label: 'Usado (Sinais visíveis de uso)' }
];
