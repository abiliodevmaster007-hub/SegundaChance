import React from 'react';
import { User } from '../types';
import { 
  MessageSquare, 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  User as UserIcon, 
  LogIn, 
  Sparkles, 
  Bell, 
  ShieldAlert 
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateListing: () => void;
  notificationCount?: number;
  onResetNotifications?: () => void;
}

export default function Header({
  currentUser,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
  onOpenCreateListing,
  notificationCount = 0,
  onResetNotifications
}: HeaderProps) {
  const handleBellClick = () => {
    setActiveTab('messages');
    if (onResetNotifications) {
      onResetNotifications();
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo - Indigo & Slate */}
        <div 
          onClick={() => setActiveTab('explore')} 
          className="flex cursor-pointer items-center space-x-2 transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
              Segunda<span className="text-indigo-600">Chance</span>
            </span>
            <span className="hidden sm:block text-[10px] font-mono tracking-wider uppercase text-slate-400">
              Desapega com simplicidade
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'explore'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Explorar Anúncios
          </button>
          
          {currentUser && (
            <>
              <button
                onClick={() => setActiveTab('messages')}
                className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all inline-flex items-center space-x-2 ${
                  activeTab === 'messages'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Mensagens</span>
              </button>
              
              <button
                onClick={() => setActiveTab('seller')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all inline-flex items-center space-x-2 ${
                  activeTab === 'seller'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Painel do Vendedor</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all inline-flex items-center space-x-2 ${
                    activeTab === 'admin'
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-slate-600 hover:bg-red-50/50 hover:text-red-700'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Right side buttons / Profile */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <>
              {/* Sino de Notificações com Badge */}
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"
                title={`${notificationCount} novas mensagens`}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenCreateListing}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm hover:shadow active:scale-95 duration-150"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline"> + Publicar Anúncio</span>
              </button>

              {/* User Dropdown / Info Block */}
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="hidden lg:flex flex-col text-right cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-850 group-hover:text-indigo-600 transition">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{currentUser.location}</span>
                </div>
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="h-9 w-9 rounded-lg ring-2 ring-indigo-50 flex items-center justify-center bg-indigo-50 text-indigo-700 overflow-hidden cursor-pointer hover:opacity-90 transition shrink-0"
                >
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name} 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </div>
                <button
                  onClick={onLogout}
                  title="Terminar sessão"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center space-x-1 px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="hidden sm:inline-flex items-center space-x-1 px-3.5 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <span>Criar Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Navigation Tab Bar (visible only for logged in users) */}
      {currentUser && (
        <div className="flex md:hidden border-t border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition ${
              activeTab === 'explore'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            Explorar
          </button>
          <button
            onClick={() => {
              setActiveTab('messages');
              if (onResetNotifications) onResetNotifications();
            }}
            className={`flex-1 py-1.5 text-center text-xs font-bold border-b-2 transition ${
              activeTab === 'messages'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            <div className="relative inline-block">
              Mensagens
              {notificationCount > 0 && (
                <span className="absolute -top-1.5 -right-3.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition ${
              activeTab === 'seller'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            Anúncios
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            Perfil
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition ${
                activeTab === 'admin'
                  ? 'border-red-600 text-red-650'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Admin
            </button>
          )}
        </div>
      )}
    </header>
  );
}
