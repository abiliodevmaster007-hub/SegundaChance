import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import AiAssistantTab from './components/AiAssistantTab';
import FloatingAiAssistant from './components/FloatingAiAssistant';
import Footer from './components/Footer';
import ToastNotifications from './components/ToastNotifications';
import { useAppLogic } from './hooks/useAppLogic';
import { ListingPrefillData } from './types';

export default function App() {
  const location = useLocation();
  const [aiListingPrefill, setAiListingPrefill] = useState<ListingPrefillData | null>(null);

  const {
    darkMode,
    toggleDarkMode,
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
    adminStats,
    notificationCount,
    setNotificationCount,
    toasts,
    setToasts,
    handleAuthSuccess,
    handleLogout,
    handleUpdateProfile,
    handleUpdateListingStatusAdmin,
    handleDeleteListingAdmin,
    handleCreateBanner,
    handleToggleBanner,
    handleDeleteBanner,
    fetchListings,
    fetchSellerListings,
    handleSearchSubmit,
    handleContactSellerInput,
    handleSendMessage,
    handleToggleListingStatus,
    handleDeleteListing,
    resetFilters,
  } = useAppLogic();

  const isAuthenticated = Boolean(currentUser && authToken);
  const isAdmin = Boolean(currentUser && authToken && currentUser.role === 'ADMIN');

  const handleApplyAiDraftToModal = (draft: ListingPrefillData) => {
    setAiListingPrefill(draft);
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
    } else {
      setCreateListingModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      <Header
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateListing={() => {
          setAiListingPrefill(null);
          if (!isAuthenticated) {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          } else {
            setCreateListingModalOpen(true);
          }
        }}
        notificationCount={notificationCount}
        onResetNotifications={() => setNotificationCount(0)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 overflow-hidden"
          >
            <Routes location={location}>
              {/* Rota Pública (Landing Page): Catálogo de Artigos */}
              <Route
                path="/"
                element={
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
                }
              />
              <Route path="/explore" element={<Navigate to="/" replace />} />

              {/* Rotas Protegidas de Nível USER / ADMIN (Redirecionam visitantes não autenticados para /) */}
              <Route
                path="/ai"
                element={
                  isAuthenticated ? (
                    <AiAssistantTab
                      currentUser={currentUser}
                      authToken={authToken}
                      onOpenListingDetail={setSelectedListing}
                      onContactSeller={handleContactSellerInput}
                      onApplyDraftToModal={handleApplyAiDraftToModal}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/messages"
                element={
                  isAuthenticated ? (
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
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/seller"
                element={
                  isAuthenticated && currentUser ? (
                    <SellerTab
                      sellerListings={sellerListings}
                      sellerListingsLoading={sellerListingsLoading}
                      onCreateListingClick={() => {
                        setAiListingPrefill(null);
                        setCreateListingModalOpen(true);
                      }}
                      onToggleListingStatus={handleToggleListingStatus}
                      onDeleteListing={handleDeleteListing}
                      sellerId={currentUser.id}
                      authToken={authToken}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  isAuthenticated && currentUser ? (
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-white dark:bg-slate-900 flex flex-col">
                      <UserProfile
                        currentUser={currentUser}
                        onUpdateProfile={handleUpdateProfile}
                        listings={listings}
                        onOpenListingDetail={setSelectedListing}
                        onAddPendingBanner={handleCreateBanner}
                      />
                    </main>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Rota Estritamente Restrita a Nível ADMIN (Redireciona USER comum ou visitante para /) */}
              <Route
                path="/admin"
                element={
                  isAdmin ? (
                    <main className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-950 flex flex-col">
                      <AdminPanel
                        currentUser={currentUser}
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
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/terms"
                element={
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full bg-white dark:bg-slate-900 flex flex-col">
                    <TermsTab />
                  </main>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        {activeTab !== 'admin' && activeTab !== 'terms' && activeTab !== 'ai' && (
          <AdSidePanel ads={ads} />
        )}
      </div>

      {/* Assistente Flutuante Kuenda AI apenas para utilizadores autenticados */}
      {isAuthenticated && (
        <FloatingAiAssistant
          currentUser={currentUser}
          authToken={authToken}
          activeTab={activeTab}
          onNavigateToFullAiTab={() => setActiveTab('ai')}
          onOpenListingDetail={setSelectedListing}
          onApplyDraftToModal={handleApplyAiDraftToModal}
        />
      )}

      <ToastNotifications
        toasts={toasts}
        onToastClick={() => {
          if (isAuthenticated) {
            setActiveTab('messages');
            setNotificationCount(0);
          }
        }}
      />

      <Footer onTermsClick={() => setActiveTab('terms')} />

      <AnimatePresence>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialMode={authModalMode}
            onAuthSuccess={(user, tok) => {
              handleAuthSuccess(user, tok);
              if (aiListingPrefill) {
                setCreateListingModalOpen(true);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createListingModalOpen && isAuthenticated && (
          <CreateListingModal
            isOpen={createListingModalOpen}
            onClose={() => {
              setCreateListingModalOpen(false);
              setAiListingPrefill(null);
            }}
            authToken={authToken || ''}
            initialDraft={aiListingPrefill}
            onSuccess={() => {
              fetchListings();
              if (activeTab === 'seller') fetchSellerListings();
              const newToast = {
                id: Math.random().toString(36).substring(2, 9),
                title: 'Anúncio Publicado',
                text: 'O seu anúncio já está ativo no catálogo!',
              };
              setToasts((prev) => [...prev, newToast]);
              setTimeout(() => setToasts((t) => t.filter((x) => x.id !== newToast.id)), 5000);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            isOpen={true}
            onClose={() => setSelectedListing(null)}
            onContactSeller={handleContactSellerInput}
            isCurrentUserSeller={Boolean(currentUser && selectedListing.sellerId === currentUser.id)}
            isAuthenticated={isAuthenticated}
            authToken={authToken}
            onRequireAuth={() => {
              setSelectedListing(null);
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
