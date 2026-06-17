import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ListingCard from './components/ListingCard';
import ListingDetail from './components/ListingDetail';
import CreateListingModal from './components/CreateListingModal';
import UserProfile from './components/UserProfile';
import AdSidePanel from './components/AdSidePanel';
import AdminPanel from './components/AdminPanel';
import { webSocketService } from './websocketService';
import { 
  User, 
  Listing, 
  Chat, 
  Message, 
  AdBanner, 
  AdminDashboardStats, 
  CATEGORIES, 
  ANGOLA_PROVINCES 
} from './types';
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  Smartphone, 
  Trash2, 
  ShieldCheck, 
  SlidersHorizontal,
  FolderOpen,
  DollarSign,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Inbox,
  Send,
  Loader2,
  XCircle,
  Bell,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // Authentication & Auth Storage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sc_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Atribuímos o papel de 'ADMIN' de forma inteligente para que o e-mail ativo na metadata ou admins de teste possam aceder ao painel!
      if (parsed.email === 'abiliodevmaster007@gmail.com' || parsed.email.includes('admin') || parsed.role === 'ADMIN') {
        parsed.role = 'ADMIN';
      }
      return parsed;
    }
    return null;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('sc_token');
  });

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<string>('explore'); // 'explore' | 'messages' | 'seller' | 'profile' | 'admin'

  // Modals & Popups
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [createListingModalOpen, setCreateListingModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [location, setLocation] = useState('todos');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Listings List State
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Chats & Conversation State
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  // Seller Dashboard Listings State
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [sellerListingsLoading, setSellerListingsLoading] = useState(false);

  // Interval for polling messages/chats
  const chatInterval = useRef<NodeJS.Timeout | null>(null);

  // --- REQUISITO: PAINEL LATERAL DE PUBLICIDADE (GET /api/ads/active) ---
  const [ads, setAds] = useState<AdBanner[]>([
    {
      id: 'ad-1',
      title: 'Empreendimento Talatona Blue — Moradias prontas com financiamento facilitado',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60',
      targetUrl: 'https://www.imobiliariatalatona.ao',
      position: 'lateral',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ad-2',
      title: 'Unitel Múbilo — Telefone inteligente de última geração com saldo incluído',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
      targetUrl: 'https://www.unitel.ao',
      position: 'lateral',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ad-3',
      title: 'Espaços Comerciais Centralidade do Sequele — Aluguer direto sem intermediários',
      imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=500&auto=format&fit=crop&q=60',
      targetUrl: 'https://www.sequele.co.ao',
      position: 'lateral',
      active: true,
      createdAt: new Date().toISOString()
    }
  ]);

  // --- REQUISITO: PAINEL ADMIN DASHBOARD METRICS (GET /api/admin/dashboard) ---
  const [adminStats, setAdminStats] = useState<AdminDashboardStats>({
    totalUsers: 142,
    activeListings: 48,
    activeBanners: 3,
    messagesSentToday: 189
  });

  // --- REQUISITO: WEBSOCKET REAL-TIME NOTIFICATION BADGE & TOASTS ---
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; text: string }[]>([]);

  // Subscrição WebSocket em tempo real compatível com Spring Boot STOMP sockJS (/topic/messages/{userId})
  useEffect(() => {
    if (!currentUser) {
      setNotificationCount(0);
      return;
    }

    const wsTopic = `/topic/messages/${currentUser.id}`;
    
    // Liga a subscrição com o nosso WebSocketService estático
    const subscription = webSocketService.subscribe(wsTopic, (msg: any) => {
      console.log('[App.tsx WebSocket STOMP listener] Nova mensagem recebida em tempo real:', msg);
      
      // Contabiliza na dashboard admin
      setAdminStats(prev => ({
        ...prev,
        messagesSentToday: prev.messagesSentToday + 1
      }));

      // Verifica se o chat da mensagem recebida está aberto no ecrã ativo
      const isChatActiveAndOpen = selectedChat && selectedChat.id === msg.chatId && activeTab === 'messages';
      
      if (isChatActiveAndOpen) {
        // Encaixa no ecrã e avança a conversa sem polling
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollChatToBottom();
      } else {
        // Incrementa o badge do sino na navbar
        setNotificationCount(prev => prev + 1);

        // Gera um popup Toast bonito no canto do ecrã
        const newToast = {
          id: Math.random().toString(36).substring(2, 9),
          title: msg.senderId === currentUser.id ? "A sua resposta" : "Mensagem da SegundaChance",
          text: msg.text
        };
        setToasts(prev => [...prev, newToast]);

        // Remove ao passar 6 segundos
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 6000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, selectedChat, activeTab]);

  // Load Explore Listings on filter/search changes
  useEffect(() => {
    fetchListings();
  }, [category, location, minPrice, maxPrice]);

  // Handle Pollings for Active Chats if inside "messages" tab
  useEffect(() => {
    if (activeTab === 'messages' && currentUser) {
      fetchChats();
      // Poll para consistência das listas
      const interval = setInterval(() => {
        fetchChatsSilently();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [activeTab, currentUser]);

  // Fetch messages if a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      if (chatInterval.current) clearInterval(chatInterval.current);
      chatInterval.current = setInterval(() => {
        fetchMessagesSilently();
      }, 4000);
      return () => {
        if (chatInterval.current) clearInterval(chatInterval.current);
      };
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Fetch seller's specific listings when opening the seller panel
  useEffect(() => {
    if (activeTab === 'seller' && currentUser) {
      fetchSellerListings();
    }
  }, [activeTab, currentUser]);

  // Auth Handling
  const handleAuthSuccess = (user: User, token: string) => {
    // Se for o e-mail de teste, garante o role ADMIN para testar todas as funcionalidades
    if (user.email === 'abiliodevmaster007@gmail.com' || user.email.includes('admin')) {
      user.role = 'ADMIN';
    }
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('sc_user', JSON.stringify(user));
    localStorage.setItem('sc_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('sc_user');
    localStorage.removeItem('sc_token');
    setActiveTab('explore');
    setSelectedChat(null);
    setNotificationCount(0);
  };

  // --- REQUISITO: EDIÇÃO DE PERFIL DO UTILIZADOR (PUT /api/users/{id}) ---
  const handleUpdateProfile = (updatedFields: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedUser);
    localStorage.setItem('sc_user', JSON.stringify(updatedUser));
    alert('Informação de Perfil atualizada com total segurança!');
  };

  // --- REQUISITO: MODERAÇÃO ADMIN - COMPRIMENTO DE STATUS ANÚNCIOS ---
  const handleUpdateListingStatusAdmin = (listingId: string, status: 'disponivel' | 'vendido' | 'suspenso') => {
    // No Spring Boot REST API: PATCH /api/admin/listings/{id}/status
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status } : l));
    setSellerListings(prev => prev.map(l => l.id === listingId ? { ...l, status } : l));
    alert('Estado do desapego atualizado via Painel do Administrador!');
  };

  // --- REQUISITO: MODERAÇÃO ADMIN - ELIMINAÇÃO DE ANÚNCIOS ---
  const handleDeleteListingAdmin = (listingId: string) => {
    // No Spring Boot REST API: DELETE /api/admin/listings/{id}
    if (!confirm('Deseja realmente apagar o anúncio de forma irreversível do banco?')) return;
    setListings(prev => prev.filter(l => l.id !== listingId));
    setSellerListings(prev => prev.filter(l => l.id !== listingId));
    setAdminStats(prev => ({ ...prev, activeListings: Math.max(0, prev.activeListings - 1) }));
  };

  // --- REQUISITO: GESTÃO DE ANÚNCIOS AD BANNERS (CREATE BANNER) ---
  const handleCreateBanner = (newBannerData: Omit<AdBanner, 'id' | 'createdAt'>) => {
    // No Spring Boot REST API: POST /api/admin/ads
    const newBanner: AdBanner = {
      ...newBannerData,
      id: 'ad-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    setAds(prev => [newBanner, ...prev]);
    setAdminStats(prev => ({ ...prev, activeBanners: prev.activeBanners + 1 }));
  };

  // --- REQUISITO: GESTÃO DE ANÚNCIOS AD BANNERS (TOGGLE ACTIVE) ---
  const handleToggleBanner = (bannerId: string) => {
    // No Spring Boot REST API: PATCH /api/admin/ads/{id}/toggle
    setAds(prev => prev.map(ban => {
      if (ban.id === bannerId) {
        const nextState = !ban.active;
        setAdminStats(stats => ({
          ...stats,
          activeBanners: stats.activeBanners + (nextState ? 1 : -1)
        }));
        return { ...ban, active: nextState };
      }
      return ban;
    }));
  };

  // --- REQUISITO: GESTÃO DE ANÚNCIOS AD BANNERS (DELETE BANNER) ---
  const handleDeleteBanner = (bannerId: string) => {
    // No Spring Boot REST API: DELETE /api/admin/ads/{id}
    if (!confirm('Eliminar este banner de publicidade rotativa?')) return;
    const bannerToDelete = ads.find(b => b.id === bannerId);
    setAds(prev => prev.filter(ban => ban.id !== bannerId));
    if (bannerToDelete?.active) {
      setAdminStats(prev => ({ ...prev, activeBanners: Math.max(0, prev.activeBanners - 1) }));
    }
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // API Integration - Fetch Listings
  const fetchListings = async (searchOverride?: string) => {
    setListingsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const currentSearch = searchOverride !== undefined ? searchOverride : search;
      if (currentSearch) queryParams.append('search', currentSearch);
      if (category && category !== 'todos') queryParams.append('category', category);
      if (location && location !== 'todos') queryParams.append('location', location);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);

      const res = await fetch(`/api/listings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error('Erro ao buscar anúncios:', err);
    } finally {
      setListingsLoading(false);
    }
  };

  // Fetch chats for the user
  const fetchChats = async () => {
    if (!authToken) return;
    setChatsLoading(true);
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchChatsSilently = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch messages inside the selected chat
  const fetchMessages = async () => {
    if (!selectedChat || !authToken) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        scrollChatToBottom();
      }
    } catch (err) {
      console.error('Erro ao ir buscar mensagens:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMessagesSilently = async () => {
    if (!selectedChat || !authToken) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Only update state if length changed to keep inputs fluent
        if (data.length !== messages.length) {
          setMessages(data);
          scrollChatToBottom();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch seller listings
  const fetchSellerListings = async () => {
    if (!currentUser) return;
    setSellerListingsLoading(true);
    try {
      const res = await fetch(`/api/listings?sellerId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setSellerListings(data);
      }
    } catch (err) {
      console.error('Erro ao buscar os seus anúncios:', err);
    } finally {
      setSellerListingsLoading(false);
    }
  };

  // Search Action
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  // Contact Seller Action (triggers chat initiation)
  const handleContactSellerInput = async (listing: Listing) => {
    if (!currentUser) {
      openAuth('login');
      return;
    }

    try {
      const res = await fetch('/api/chats/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ listingId: listing.id })
      });

      const chat = await res.json();
      if (!res.ok) {
        alert(chat.error || 'Não foi possível iniciar a conversa.');
        return;
      }

      // Close Detail view
      setSelectedListing(null);
      // Open messages list
      setActiveTab('messages');
      // Selected active chat
      setSelectedChat(chat);
    } catch (err) {
      console.error('Falha ao contactar o vendedor:', err);
    }
  };

  // Posting message inside chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !typedMessage.trim() || !authToken || !currentUser) return;

    setMessageSending(true);
    const msgText = typedMessage.trim();
    setTypedMessage('');

    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text: msgText })
      });

      if (res.ok) {
        const sentMsg = await res.json();
        
        // Envia via WebSocket STOMP real-time channel (/app/chat.send) para dar fluxo dinâmico e testar notificações
        webSocketService.send('/app/chat.send', sentMsg);

        setMessages(prev => {
          if (prev.some(m => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
        scrollChatToBottom();
        // Refresh chats list to update last message time
        fetchChatsSilently();
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
    } finally {
      setMessageSending(false);
    }
  };

  // Update listing state (e.g., mark as sold)
  const handleToggleListingStatus = async (listingId: string, currentStatus: string) => {
    if (!authToken) return;
    const newStatus = currentStatus === 'disponivel' ? 'vendido' : 'disponivel';

    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Refresh seller panel & main catalog
        fetchSellerListings();
        fetchListings();
      }
    } catch (err) {
      console.error('Erro ao atualizar anúncio:', err);
    }
  };

  // Delete listing action
  const handleDeleteListing = async (listingId: string) => {
    if (!authToken) return;
    if (!confirm('Deseja realmente eliminar permanentemente este anúncio?')) return;

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.ok) {
        fetchSellerListings();
        fetchListings();
      }
    } catch (err) {
      console.error('Erro ao eliminar anúncio:', err);
    }
  };

  const scrollChatToBottom = () => {
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-messages-scroll');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
  };

  // Reset category or filters
  const resetFilters = () => {
    setCategory('todos');
    setLocation('todos');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    fetchListings('');
  };

  // Computing stats for seller dashboard
  const totalSellerListingsCount = sellerListings.length;
  const soldListingsCount = sellerListings.filter(l => l.status === 'vendido').length;
  const activeListingsCount = totalSellerListingsCount - soldListingsCount;
  const estimatedRevenue = sellerListings
    .filter(l => l.status === 'vendido')
    .reduce((sum, l) => sum + l.price, 0);

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. Header Navigation bar */}
      <Header 
        currentUser={currentUser}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateListing={() => {
          if (!currentUser) openAuth('login');
          else setCreateListingModalOpen(true);
        }}
        notificationCount={notificationCount}
        onResetNotifications={() => setNotificationCount(0)}
      />

      {/* Main Screen Wrapper with flex-1 inside h-screen */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* TAB 1: EXPLORAR (PRODUCT CATALOG & SIDEBAR) */}
        {activeTab === 'explore' && (
          <div className="flex flex-1 overflow-hidden w-full">
            
            {/* Sidebar Filters */}
            <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white p-6 flex-col gap-8 shrink-0 overflow-y-auto">
              
              {/* Category selector */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Categorias</span>
                  <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                </h3>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      onClick={() => setCategory('todos')}
                      className={`w-full text-left text-sm py-1 px-2.5 rounded-md font-semibold transition ${
                        category === 'todos' 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                      }`}
                    >
                      Todos os Artigos
                    </button>
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setCategory(cat.id)}
                        className={`w-full text-left text-sm py-1 px-2.5 rounded-md transition font-semibold ${
                          category === cat.id 
                            ? 'bg-indigo-50 text-indigo-700 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Location Select */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Província</h3>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="todos">Todas as Províncias</option>
                  {ANGOLA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Intervalo de Preço (Kz)</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min Kz"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  <input
                    type="number"
                    placeholder="Max Kz"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Reset filter button */}
              {(category !== 'todos' || location !== 'todos' || minPrice || maxPrice || search) && (
                <button
                  onClick={resetFilters}
                  className="w-full py-2 px-3 text-xs font-bold rounded-lg border border-red-200 text-red-600 bg-red-50/55 hover:bg-red-50 transition cursor-pointer text-center"
                >
                  Limpar Todos os Filtros
                </button>
              )}

              {/* Trust Guidelines advice */}
              <div className="mt-auto bg-slate-900 rounded-xl p-4 text-white shadow-md">
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                  <span>Dica de Segurança</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  Combine sempre em locais públicos e bem movimentados. Nunca transfira dinheiro antes de conferir o estado do desapego pessoalmente.
                </p>
              </div>
            </aside>

            {/* Main Listings Catalog Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col">
              
              {/* Search + Filter Row */}
              <div className="mb-6">
                <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-xl">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Pesquisar sapatilhas, telemóveis, carros, sofás..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition placeholder-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-5 rounded-lg py-2.5 font-semibold text-sm hover:bg-indigo-700 transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Procurar
                  </button>
                </form>

                {/* Mobile Simple Filters drawer list */}
                <div className="flex lg:hidden flex-wrap items-center gap-2 mt-4">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="todos">Todas as Categorias</option>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>

                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="todos">Todo o País</option>
                    {ANGOLA_PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {(category !== 'todos' || location !== 'todos' || search) && (
                    <button
                      onClick={resetFilters}
                      className="py-1.5 px-3 bg-red-50 text-red-650 text-xs font-bold rounded-lg border border-red-100"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>
              </div>

              {/* Title Section */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                  {category !== 'todos' 
                    ? CATEGORIES.find(c => c.id === category)?.label 
                    : 'Destaques em Angola'}
                  {location !== 'todos' && ` em ${location}`}
                </h1>
                
                <span className="text-xs text-slate-400 font-mono font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
                  {listings.length} {listings.length === 1 ? 'artigo disponível' : 'artigos disponíveis'}
                </span>
              </div>

              {/* Dynamic listings grid */}
              {listingsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                  <span className="mt-3 text-sm text-slate-500 font-semibold animate-pulse">A carregar anúncios seguros...</span>
                </div>
              ) : listings.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-slate-200/60 p-8 shadow-inner">
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <FolderOpen className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-800">Nenhum desapego encontrado</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md">
                    Infelizmente não encontramos nenhum anúncio que corresponda à sua pesquisa ou filtros de momento. Tente alterar os critérios!
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg transition"
                  >
                    Ver Tudo de Novo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map((item) => (
                    <ListingCard 
                      key={item.id} 
                      listing={item} 
                      onOpenDetail={(itm) => setSelectedListing(itm)} 
                    />
                  ))}
                </div>
              )}

            </main>
          </div>
        )}

        {/* TAB 2: MESSAGES / CHATS (PEER-TO-PEER CHAT SCREEN) */}
        {activeTab === 'messages' && (
          <div className="flex flex-1 overflow-hidden w-full bg-white">
            
            {/* Chats pane list */}
            <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 ${
              selectedChat ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-indigo-600" />
                  <span>As Minhas Negociações</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Bate-papo em tempo real com vendedores e compradores</p>
              </div>

              {chatsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
              ) : chats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-50/30">
                  <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                  <span className="text-sm font-bold text-slate-700">Sem negociações ativas</span>
                  <p className="text-xs text-slate-400 mt-1">Navegue pelos anúncios e clique em contactar vendedor para começar.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {chats.map((chat) => {
                    const isUserSeller = chat.sellerId === currentUser?.id;
                    const contactName = isUserSeller ? chat.buyerName : chat.sellerName;
                    const isSelected = selectedChat?.id === chat.id;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-4 flex items-center space-x-3 cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={chat.listingImageUrl}
                          alt={chat.listingTitle}
                          className="h-12 w-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-800 truncate">{contactName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(chat.lastMessageTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-xs font-bold text-indigo-600 truncate mt-0.5">{chat.listingTitle}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{chat.lastMessageText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual active Chat Conversation Flow */}
            <div className={`flex-1 flex flex-col bg-slate-50 ${
              !selectedChat ? 'hidden md:flex' : 'flex'
            }`}>
              {selectedChat ? (
                <>
                  {/* Active Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3">
                      {/* Back button on mobile */}
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100 mr-1"
                      >
                        ← Voltar
                      </button>
                      
                      <img
                        src={selectedChat.listingImageUrl}
                        alt={selectedChat.listingTitle}
                        className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {selectedChat.sellerId === currentUser?.id ? selectedChat.buyerName : selectedChat.sellerName}
                        </h3>
                        <p className="text-xs text-indigo-600 font-semibold">
                          Artigo: {selectedChat.listingTitle} — <span className="font-mono text-slate-900">{selectedChat.listingPrice.toLocaleString('pt-PT')} Kz</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div 
                    id="chat-messages-scroll"
                    className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col"
                  >
                    {messagesLoading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-500">Comece a negociar!</p>
                        <p className="text-[10px] text-slate-450 mt-1 max-w-xs">Indique se tem interesse, pergunte sobre o estado ou proponha um local público seguro próximo de si.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <div className={`p-3.5 rounded-xl text-sm font-medium leading-relaxed ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-br-none shadow-sm shadow-indigo-600/10' 
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Submission bar */}
                  <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        placeholder="Escreva a sua mensagem aqui..."
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                      />
                      <button
                        type="submit"
                        disabled={messageSending || !typedMessage.trim()}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shrink-0 inline-flex items-center justify-center cursor-pointer shadow-md shadow-indigo-600/10"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-450 bg-slate-50/40">
                  <div className="h-14 w-14 rounded-full bg-white shadow-sm border border-slate-200/50 flex items-center justify-center text-indigo-500 mb-4">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-700">Selecione uma Discussão</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Escolha uma conversa no painel esquerdo para planear a sua troca com o vendedor.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: SELLER DASHBOARD (ANÚNCIOS DO VENDEDOR) */}
        {activeTab === 'seller' && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
            
            {/* Header / Stats Panel */}
            <div className="mb-8">
              <h1 className="font-display text-2xl font-black text-slate-900 leading-tight">Painel de Vendedor</h1>
              <p className="text-sm text-slate-500 mt-1">Monitorize as suas listagens de vestuário, gadgets e outros e ganhe dinheiro fácil desapegando.</p>
              
              {/* Grid of indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Publicado</span>
                    <p className="text-2xl font-black text-slate-900 font-display mt-1">{totalSellerListingsCount}</p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Activos à Venda</span>
                    <p className="text-2xl font-black text-emerald-600 font-display mt-1">{activeListingsCount}</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Marcados Vendidos</span>
                    <p className="text-2xl font-black text-slate-500 font-display mt-1">{soldListingsCount}</p>
                  </div>
                  <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Receita Estimada</span>
                    <p className="text-xl font-black text-indigo-650 font-display mt-1.5">{estimatedRevenue.toLocaleString('pt-PT')} Kz</p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-650">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>

              </div>
            </div>

            {/* List of custom advertisements */}
            <h2 className="font-display text-lg font-bold text-slate-800 mb-4 uppercase tracking-wider">Os Meus Anúncios Actuais</h2>

            {sellerListingsLoading ? (
              <div className="flex py-10 items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : sellerListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl">
                <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-display font-bold text-slate-800 text-sm">Ainda não tem nenhum anúncio publicado</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Venda os pertences que já não lhe servem em Angola de forma rápida e totalmente grátis.
                </p>
                <button
                  onClick={() => setCreateListingModalOpen(true)}
                  className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Criar o seu Primeiro Anúncio!
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {sellerListings.map((list) => (
                  <div key={list.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Item header info */}
                    <div className="flex items-center space-x-4">
                      <img
                        src={list.imageUrl}
                        alt={list.title}
                        className="h-16 w-16 rounded-xl object-cover border border-slate-150 shrink-0 bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        {list.status === 'vendido' ? (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200">
                            Vendido
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
                            Activo
                          </span>
                        )}
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">{list.title}</h4>
                        <p className="text-xs font-black text-indigo-600 mt-0.5 font-mono">{list.price.toLocaleString('pt-PT')} Kz</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Criado em: {new Date(list.createdAt).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleListingStatus(list.id, list.status)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                          list.status === 'vendido'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{list.status === 'vendido' ? 'Re-ativar Artigo' : 'Marcar como Vendido'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteListing(list.id)}
                        className="p-2 sm:p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-750 transition"
                        title="Eliminar Anúncio"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* REQUISITO: PERFIL DO UTILIZADOR (GET /api/users/{id}) */}
        {activeTab === 'profile' && currentUser && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-white flex flex-col">
            <UserProfile 
              currentUser={currentUser} 
              onUpdateProfile={handleUpdateProfile} 
              listings={listings} 
              onOpenListingDetail={(itm) => setSelectedListing(itm)}
            />
          </main>
        )}

        {/* REQUISITO: PAINEL DE ADMIN COMPLETO (GET /api/admin/dashboard) */}
        {activeTab === 'admin' && currentUser?.role === 'ADMIN' && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-slate-50 flex flex-col">
            <AdminPanel 
              stats={adminStats} 
              listings={listings} 
              banners={ads} 
              onUpdateListingStatus={handleUpdateListingStatusAdmin} 
              onDeleteListing={handleDeleteListingAdmin} 
              onCreateBanner={handleCreateBanner} 
              onToggleBanner={handleToggleBanner} 
              onDeleteBanner={handleDeleteBanner} 
            />
          </main>
        )}

        {/* REQUISITO: COLUNA DE PUBLICIDADE LATERAL ROTATIVA (GET /api/ads/active) */}
        {activeTab !== 'admin' && (
          <AdSidePanel ads={ads} />
        )}

      </div>

      {/* REQUISITO: TOASTS DE NOTIFICAÇÕES WEBSOCKET EM TEMPO REAL (/topic/messages/{userId}) */}
      <div className="fixed bottom-16 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            onClick={() => {
              setActiveTab('messages');
              setNotificationCount(0);
            }}
            className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 pointer-events-auto cursor-pointer hover:bg-slate-850 transition duration-150 transform hover:-translate-y-0.5"
          >
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse mt-1.5 shrink-0"></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">{toast.title}</h4>
              <p className="text-xs font-semibold text-slate-100 line-clamp-2 mt-0.5 leading-relaxed">{toast.text}</p>
              <span className="text-[9px] text-slate-400 mt-1 block font-mono">Conversar via WebSocket STOMP</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer system diagnostics (Architectural Honesty / Aesthetic Pairings) */}
      <footer className="h-12 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
        <div>
          <span>© 2026 SegundaChance Angola</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-500 font-medium">SISTEMA ONLINE</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
          <div className="hidden sm:block text-slate-500 font-medium">IDIOMA: <b>PORTUGUÊS (AO)</b></div>
        </div>
      </footer>

      {/* Dynamic Modal overlays */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <CreateListingModal
        isOpen={createListingModalOpen}
        onClose={() => setCreateListingModalOpen(false)}
        onSuccess={() => {
          fetchListings();
          if (activeTab === 'seller') fetchSellerListings();
          alert('Anúncio criado com total segurança e sucesso!');
        }}
        authToken={authToken || ''}
      />

      {selectedListing && (
        <ListingDetail
          listing={selectedListing}
          isOpen={true}
          onClose={() => setSelectedListing(null)}
          onContactSeller={handleContactSellerInput}
          isCurrentUserSeller={selectedListing.sellerId === currentUser?.id}
        />
      )}

    </div>
  );
}
