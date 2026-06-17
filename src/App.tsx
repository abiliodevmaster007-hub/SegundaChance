import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ListingDetail from './components/ListingDetail';
import CreateListingModal from './components/CreateListingModal';
import UserProfile from './components/UserProfile';
import AdSidePanel from './components/AdSidePanel';
import AdminPanel from './components/AdminPanel';
import ProductCatalog from './components/ProductCatalog';
import MessagesTab from './components/MessagesTab';
import SellerTab from './components/SellerTab';
import TermsTab from './components/TermsTab';
import { webSocketService } from './websocketService';
import { 
  User, 
  Listing, 
  Chat, 
  Message, 
  AdBanner, 
  AdminDashboardStats 
} from './types';

export default function App() {
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

  const handleUpdateListingStatusAdmin = (listingId: string, status: 'disponivel' | 'vendido' | 'suspenso') => {
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: status === 'suspenso' ? 'vendido' : status } : l));
    setSellerListings(prev => prev.map(l => l.id === listingId ? { ...l, status: status === 'suspenso' ? 'vendido' : status } : l));
    alert('Estado do desapego atualizado via Painel do Administrador!');
  };

  const handleDeleteListingAdmin = (listingId: string) => {
    if (!confirm('Deseja realmente apagar o anúncio de forma irreversível do banco?')) return;
    setListings(prev => prev.filter(l => l.id !== listingId));
    setSellerListings(prev => prev.filter(l => l.id !== listingId));
    setAdminStats(prev => ({ ...prev, activeListings: Math.max(0, prev.activeListings - 1) }));
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
      const res = await fetch(`/api/listings?${q.toString()}`);
      if (res.ok) setListings(await res.json());
    } catch (e) {
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!authToken) return;
    setChatsLoading(true);
    try {
      const res = await fetch('/api/chats', { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) setChats(await res.json());
    } catch (e) {
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchChatsSilently = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/chats', { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) setChats(await res.json());
    } catch (e) {}
  };

  const fetchMessages = async () => {
    if (!selectedChat || !authToken) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) setMessages(await res.json());
    } catch (e) {
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMessagesSilently = async () => {
    if (!selectedChat || !authToken) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, { headers: { 'Authorization': `Bearer ${authToken}` } });
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
      const res = await fetch(`/api/listings?sellerId=${currentUser.id}`);
      if (res.ok) setSellerListings(await res.json());
    } catch (e) {
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
      const res = await fetch('/api/chats/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ listingId: l.id })
      });
      const chat = await res.json();
      if (!res.ok) { alert(chat.error || 'Não foi possível.'); return; }
      setSelectedListing(null);
      setActiveTab('messages');
      setSelectedChat(chat);
    } catch (e) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !typedMessage.trim() || !authToken || !currentUser) return;
    setMessageSending(true);
    const msgText = typedMessage.trim();
    setTypedMessage('');
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
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
    } finally {
      setMessageSending(false);
    }
  };

  const handleToggleListingStatus = async (id: string, currentStatus: string) => {
    if (!authToken) return;
    const s = currentStatus === 'disponivel' ? 'vendido' : 'disponivel';
    try {
      const res = await fetch(`/api/listings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: s })
      });
      if (res.ok) { fetchSellerListings(); fetchListings(); }
    } catch (e) {}
  };

  const handleDeleteListing = async (id: string) => {
    if (!authToken) return;
    if (!confirm('Deseja realmente eliminar permanentemente este anúncio?')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) { fetchSellerListings(); fetchListings(); }
    } catch (e) {}
  };

  const resetFilters = () => {
    setCategory('todos');
    setLocationState('todos');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    fetchListings('');
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden font-sans">
      <Header 
        currentUser={currentUser}
        onOpenAuth={(mode) => { setAuthModalMode(mode); setAuthModalOpen(true); }}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateListing={() => {
          if (!currentUser) { setAuthModalMode('login'); setAuthModalOpen(true); }
          else setCreateListingModalOpen(true);
        }}
        notificationCount={notificationCount}
        onResetNotifications={() => setNotificationCount(0)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={
            <ProductCatalog
              listings={listings}
              listingsLoading={listingsLoading}
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              location={locationState}
              setLocation={setLocationState}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              onSearchSubmit={handleSearchSubmit}
              onResetFilters={resetFilters}
              onOpenListingDetail={setSelectedListing}
            />
          } />
          <Route path="/explore" element={<Navigate to="/" replace />} />
          <Route path="/messages" element={
            <MessagesTab
              currentUser={currentUser}
              chats={chats}
              chatsLoading={chatsLoading}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              messages={messages}
              messagesLoading={messagesLoading}
              typedMessage={typedMessage}
              setTypedMessage={setTypedMessage}
              messageSending={messageSending}
              onSendMessage={handleSendMessage}
            />
          } />
          <Route path="/seller" element={
            currentUser ? (
              <SellerTab
                sellerListings={sellerListings}
                sellerListingsLoading={sellerListingsLoading}
                onCreateListingClick={() => setCreateListingModalOpen(true)}
                onToggleListingStatus={handleToggleListingStatus}
                onDeleteListing={handleDeleteListing}
              />
            ) : ( <Navigate to="/" replace /> )
          } />
          <Route path="/profile" element={
            currentUser ? (
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-white flex flex-col">
                <UserProfile 
                  currentUser={currentUser} 
                  onUpdateProfile={handleUpdateProfile} 
                  listings={listings} 
                  onOpenListingDetail={setSelectedListing}
                  onAddPendingBanner={(bannerData) => {
                    const b: AdBanner = {
                      ...bannerData,
                      id: 'ad-' + Math.random().toString(36).substring(2, 9),
                      createdAt: new Date().toISOString()
                    };
                    setAds(p => [b, ...p]);
                    setAdminStats(p => ({ ...p, messagesSentToday: p.messagesSentToday + 1 }));
                  }}
                />
              </main>
            ) : ( <Navigate to="/" replace /> )
          } />
          <Route path="/admin" element={
            currentUser?.role === 'ADMIN' ? (
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-slate-50 flex flex-col">
                <AdminPanel 
                  stats={adminStats} 
                  listings={listings} 
                  banners={ads} 
                  onUpdateListingStatus={handleUpdateListingStatusAdmin} 
                  onDeleteListing={handleDeleteListingAdmin} 
                  onCreateBanner={(btn) => {
                    const b: AdBanner = { ...btn, id: 'ad-' + Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() };
                    setAds(prev => [b, ...prev]);
                    setAdminStats(prev => ({ ...prev, activeBanners: prev.activeBanners + 1 }));
                  }}
                  onToggleBanner={(id) => setAds(p => p.map(b => b.id === id ? { ...b, active: !b.active } : b))}
                  onDeleteBanner={(id) => {
                    if (confirm('Eliminar?')) setAds(p => p.filter(b => b.id !== id));
                  }}
                />
              </main>
            ) : ( <Navigate to="/" replace /> )
          } />
          <Route path="/terms" element={
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-white flex flex-col">
              <TermsTab />
            </main>
          } />
        </Routes>
        {activeTab !== 'admin' && activeTab !== 'terms' && <AdSidePanel ads={ads} />}
      </div>

      <div className="fixed bottom-16 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id}
            onClick={() => { setActiveTab('messages'); setNotificationCount(0); }}
            className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-lg flex items-start gap-4 pointer-events-auto cursor-pointer hover:bg-slate-850 transition duration-150 transform hover:-translate-y-0.5"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse mt-1.5 shrink-0"></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">{t.title}</h4>
              <p className="text-xs font-semibold text-slate-100 line-clamp-2 mt-0.5">{t.text}</p>
              <span className="text-[9px] text-slate-400 mt-1 block font-mono font-bold">WebSocket STOMP Channel</span>
            </div>
          </div>
        ))}
      </div>

      <footer className="h-12 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
        <div className="flex items-center gap-2">
          <span>© 2026 SegundaChance Angola</span>
          <span className="text-slate-200">•</span>
          <button 
            id="footer-terms-btn" 
            onClick={() => setActiveTab('terms')} 
            className="hover:text-indigo-650 transition cursor-pointer font-extrabold uppercase"
          >
            Termos & Privacidade
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-500 font-bold">ONLINE</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
          <span className="hidden sm:block text-slate-550">IDIOMA: <b>PORTUGUÊS (AO)</b></span>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authModalMode} onAuthSuccess={handleAuthSuccess} />
      <CreateListingModal isOpen={createListingModalOpen} onClose={() => setCreateListingModalOpen(false)} authToken={authToken || ''} onSuccess={() => { fetchListings(); if (activeTab === 'seller') fetchSellerListings(); alert('Anúncio criado com sucesso!'); }} />
      {selectedListing && <ListingDetail listing={selectedListing} isOpen={true} onClose={() => setSelectedListing(null)} onContactSeller={handleContactSellerInput} isCurrentUserSeller={selectedListing.sellerId === currentUser?.id} />}
    </div>
  );
}
