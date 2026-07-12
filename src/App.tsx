import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Footer from './components/Footer';
import ToastNotifications from './components/ToastNotifications';
import { useAppLogic } from './hooks/useAppLogic';
import { AdBanner } from './types';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    authToken,
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
    listingsLoading,
    chats,
    chatsLoading,
    selectedChat,
    setSelectedChat,
    messages,
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
    handleAuthSuccess,
    handleLogout,
    handleUpdateProfile,
    handleUpdateListingStatusAdmin,
    handleDeleteListingAdmin,
    fetchListings,
    fetchChats,
    fetchMessages,
    fetchSellerListings,
    handleSearchSubmit,
    handleContactSellerInput,
    handleSendMessage,
    handleToggleListingStatus,
    handleDeleteListing,
    resetFilters,
  } = useAppLogic();

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

      <ToastNotifications 
        toasts={toasts} 
        onToastClick={() => { setActiveTab('messages'); setNotificationCount(0); }} 
      />

      <Footer onTermsClick={() => setActiveTab('terms')} />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authModalMode} onAuthSuccess={handleAuthSuccess} />
      <CreateListingModal isOpen={createListingModalOpen} onClose={() => setCreateListingModalOpen(false)} authToken={authToken || ''} onSuccess={() => { fetchListings(); if (activeTab === 'seller') fetchSellerListings(); alert('Anúncio criado com sucesso!'); }} />
      {selectedListing && <ListingDetail listing={selectedListing} isOpen={true} onClose={() => setSelectedListing(null)} onContactSeller={handleContactSellerInput} isCurrentUserSeller={selectedListing.sellerId === currentUser?.id} />}
    </div>
  );
}
