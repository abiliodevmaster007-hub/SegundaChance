import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { webSocketService } from '../websocketService';
import { getApiUrl } from '../apiConfig';
import { 
  User, 
  Listing, 
  Chat, 
  Message, 
  AdBanner, 
  AdminDashboardStats 
} from '../types';

export function useAppLogic() {
  const navigate = useNavigate();
  const location = useLocation();

  // ActiveTab navigation synchronized cleanly with the route path to support backward compat 
  const activeTab = location.pathname === '/' || location.pathname === '/explore' 
    ? 'explore' 
    : location.pathname.substring(1);

  const setActiveTab = (tab: string) => {
    navigate(tab === 'explore' ? '/' : `/${tab}`);
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sc_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email === 'abiliodevmaster007@gmail.com' || parsed.email.includes('admin') || parsed.role === 'ADMIN') {
        parsed.role = 'ADMIN';
      }
      return parsed;
    }
    return null;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('sc_token'));

  // Modals Overlay Config
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [createListingModalOpen, setCreateListingModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Search/Filters Core Client State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [locationState, setLocationState] = useState('todos');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Primary list state
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Real-time Chat Threads
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  // Seller items state
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [sellerListingsLoading, setSellerListingsLoading] = useState(false);

  const chatInterval = useRef<NodeJS.Timeout | null>(null);

  // Advertising & Metrics Banners State
  const [ads, setAds] = useState<AdBanner[]>([
    {
      id: "ad-1",
      title: "Empreendimento Talatona Blue — Moradias prontas com financiamento facilitado",
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60",
      targetUrl: "https://www.imobiliariatalatona.ao",
      position: "lateral",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ad-2",
      title: "Unitel Múbilo — Telefone inteligente de última geração com saldo incluído",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60",
      targetUrl: "https://www.unitel.ao",
      position: "lateral",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ad-3",
      title: "Espaços Comerciais Centralidade do Sequele — Aluguer direto sem intermediários",
      imageUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=500&auto=format&fit=crop&q=60",
      targetUrl: "https://www.sequele.co.ao",
      position: "lateral",
      active: true,
      createdAt: new Date().toISOString()
    }
  ]);

  const [adminStats, setAdminStats] = useState<AdminDashboardStats>({
    totalUsers: 142,
    activeListings: 48,
    activeBanners: 3,
    messagesSentToday: 189
  });

  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; text: string }[]>([]);

  // Spring Boot Stomp SockJS Simulated WebSocket Engine listener
  useEffect(() => {
    if (!currentUser) {
      setNotificationCount(0);
      return;
    }
    const subscription = webSocketService.subscribe(`/topic/messages/${currentUser.id}`, (msg: any) => {
      setAdminStats(prev => ({ ...prev, messagesSentToday: prev.messagesSentToday + 1 }));
      const isOpen = selectedChat && selectedChat.id === msg.chatId && activeTab === 'messages';
      if (isOpen) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      } else {
        setNotificationCount(p => p + 1);
        const newToast = {
          id: Math.random().toString(36).substring(2, 9),
          title: msg.senderId === currentUser.id ? "A sua resposta" : "Mensagem da SegundaChance",
          text: msg.text
        };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== newToast.id)), 6000);
      }
    });
    return () => subscription.unsubscribe();
  }, [currentUser, selectedChat, activeTab]);

  useEffect(() => {
    fetchListings();
  }, [category, locationState, minPrice, maxPrice]);

  useEffect(() => {
    if (activeTab === 'messages' && currentUser) {
      fetchChats();
      const interval = setInterval(() => fetchChatsSilently(), 6000);
      return () => clearInterval(interval);
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      if (chatInterval.current) clearInterval(chatInterval.current);
      chatInterval.current = setInterval(() => fetchMessagesSilently(), 4000);
      return () => { if (chatInterval.current) clearInterval(chatInterval.current); };
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (activeTab === 'seller' && currentUser) {
      fetchSellerListings();
    }
  }, [activeTab, currentUser]);

  // Auth Action handlers
  const handleAuthSuccess = (u: User, tok: string) => {
    if (u.email === 'abiliodevmaster007@gmail.com' || u.email.includes('admin')) u.role = 'ADMIN';
    setCurrentUser(u);
    setAuthToken(tok);
    localStorage.setItem('sc_user', JSON.stringify(u));
    localStorage.setItem('sc_token', tok);
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

  const handleUpdateProfile = (fields: Partial<User>) => {
    if (!currentUser) return;
    const upd = { ...currentUser, ...fields };
    setCurrentUser(upd);
    localStorage.setItem('sc_user', JSON.stringify(upd));
    alert('Informação de Perfil atualizada com total segurança!');
  };

  const handleUpdateListingStatusAdmin = async (listingId: string, status: 'disponivel' | 'vendido' | 'suspenso') => {
    const normalizedStatus = status === 'suspenso' ? 'vendido' : status;
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: normalizedStatus } : l));
    setSellerListings(prev => prev.map(l => l.id === listingId ? { ...l, status: normalizedStatus } : l));
    try {
      await fetch(getApiUrl(`/api/listings/${listingId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: normalizedStatus })
      });
    } catch (e) {}
  };

  const handleDeleteListingAdmin = async (listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
    setSellerListings(prev => prev.filter(l => l.id !== listingId));
    setAdminStats(prev => ({ ...prev, activeListings: Math.max(0, prev.activeListings - 1) }));
    try {
      await fetch(getApiUrl(`/api/listings/${listingId}`), { method: 'DELETE' });
    } catch (e) {}
  };

  // REST endpoints simulators
  const fetchListings = async (searchOverride?: string) => {
    setListingsLoading(true);
    try {
      const q = new URLSearchParams();
      const s = searchOverride !== undefined ? searchOverride : search;
      if (s) q.append('search', s);
      if (category && category !== 'todos') q.append('category', category);
      if (locationState && locationState !== 'todos') q.append('location', locationState);
      if (minPrice) q.append('minPrice', minPrice);
      if (maxPrice) q.append('maxPrice', maxPrice);
      const res = await fetch(getApiUrl(`/api/listings?${q.toString()}`));
      if (res.ok) {
        setListings(await res.json());
      }
    } catch (e) {
      console.warn('Falha ao obter anúncios da API (servidor offline):', e);
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!authToken || !currentUser) return;
    setChatsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/chats'), { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) {
        setChats(await res.json());
      }
    } catch (e) {
      console.warn('Falha ao obter chats da API (servidor offline):', e);
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchChatsSilently = async () => {
    if (!authToken || !currentUser) return;
    try {
      const res = await fetch(getApiUrl('/api/chats'), { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) {
        setChats(await res.json());
      }
    } catch (e) {}
  };

  const fetchMessages = async () => {
    if (!selectedChat || !authToken) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/chats/${selectedChat.id}/messages`), { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.warn('Falha ao obter mensagens da API (servidor offline):', e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMessagesSilently = async () => {
    if (!selectedChat || !authToken) return;
    try {
      const res = await fetch(getApiUrl(`/api/chats/${selectedChat.id}/messages`), { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.length !== messages.length) setMessages(d);
      }
    } catch (e) {}
  };

  const fetchSellerListings = async () => {
    if (!currentUser) return;
    setSellerListingsLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/listings?sellerId=${currentUser.id}`));
      if (res.ok) {
        setSellerListings(await res.json());
      }
    } catch (e) {
      console.warn('Falha ao obter anúncios do vendedor (servidor offline):', e);
    } finally {
      setSellerListingsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleContactSellerInput = async (l: Listing) => {
    if (!currentUser) { setAuthModalMode('login'); setAuthModalOpen(true); return; }
    try {
      const res = await fetch(getApiUrl('/api/chats/start'), {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
         body: JSON.stringify({ listingId: l.id })
      });
      const chat = await res.json();
      if (!res.ok) { alert(chat.error || 'Não foi possível.'); return; }
      setSelectedListing(null);
      setActiveTab('messages');
      setSelectedChat(chat);
    } catch (e) {
      console.warn('Falha ao iniciar conversa na API:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !typedMessage.trim() || !authToken || !currentUser) return;
    setMessageSending(true);
    const msgText = typedMessage.trim();
    setTypedMessage('');
    try {
      const res = await fetch(getApiUrl(`/api/chats/${selectedChat.id}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ text: msgText })
      });
      if (res.ok) {
        const sent = await res.json();
        webSocketService.send('/app/chat.send', sent);
        setMessages(prev => prev.some(m => m.id === sent.id) ? prev : [...prev, sent]);
        fetchChatsSilently();
      }
    } catch (e) {
      console.warn('Falha ao enviar mensagem na API:', e);
    } finally {
      setMessageSending(false);
    }
  };

  const handleToggleListingStatus = async (id: string, currentStatus: string) => {
    if (!authToken) return;
    const s = currentStatus === 'disponivel' ? 'vendido' : 'disponivel';
    try {
      const res = await fetch(getApiUrl(`/api/listings/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: s })
      });
      if (res.ok) { 
        fetchSellerListings(); 
        fetchListings(); 
      }
    } catch (e) {
      console.warn('Falha ao alternar estado do anúncio:', e);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!authToken) return;
    if (!confirm('Deseja realmente eliminar permanentemente este anúncio?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/listings/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) { 
        fetchSellerListings(); 
        fetchListings(); 
      }
    } catch (e) {
      console.warn('Falha ao deletar anúncio:', e);
    }
  };

  const resetFilters = () => {
    setCategory('todos');
    setLocationState('todos');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    fetchListings('');
  };

  return {
    activeTab,
    setActiveTab,
    currentUser,
    setCurrentUser,
    authToken,
    setAuthToken,
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    createListingModalOpen,
    setCreateListingModalOpen,
    selectedListing,
    setSelectedListing,
    search,
    setSearch,
    category,
    setCategory,
    locationState,
    setLocationState,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    listings,
    setListings,
    listingsLoading,
    chats,
    setChats,
    chatsLoading,
    selectedChat,
    setSelectedChat,
    messages,
    setMessages,
    messagesLoading,
    typedMessage,
    setTypedMessage,
    messageSending,
    sellerListings,
    sellerListingsLoading,
    ads,
    setAds,
    adminStats,
    setAdminStats,
    notificationCount,
    setNotificationCount,
    toasts,
    setToasts,
    handleAuthSuccess,
    handleLogout,
    handleUpdateProfile,
    handleUpdateListingStatusAdmin,
    handleDeleteListingAdmin,
    fetchListings,
    fetchChats,
    fetchChatsSilently,
    fetchMessages,
    fetchMessagesSilently,
    fetchSellerListings,
    handleSearchSubmit,
    handleContactSellerInput,
    handleSendMessage,
    handleToggleListingStatus,
    handleDeleteListing,
    resetFilters,
  };
}
