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
