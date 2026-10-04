import React from 'react';
import { User } from '../types';
import {
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  User as UserIcon,
  LogIn,
  Bell,
  Server,
  Bot,
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
  onResetNotifications,
}: HeaderProps) {
  const handleBellClick = () => {
    setActiveTab('messages');
    if (onResetNotifications) {
      onResetNotifications();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Title (Single text element wordmark) */}
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 hover:opacity-90 transition cursor-pointer whitespace-nowrap"
        >
          SegundaChance
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`py-1 text-sm font-medium transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'explore'
                ? 'border-indigo-600 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Explorar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-1 text-sm font-medium transition border-b-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="h-4 w-4 text-emerald-600" />
            <span>Kuenda AI</span>
          </button>

          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`py-1 text-sm font-medium transition border-b-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'messages'
                    ? 'border-indigo-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Mensagens</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('seller')}
                className={`py-1 text-sm font-medium transition border-b-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'seller'
                    ? 'border-indigo-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Vendedor</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-1 text-sm font-medium transition border-b-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'admin'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="h-4 w-4 text-indigo-600" />
            <span>Gestor Central</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <>
              <button
                type="button"
                onClick={handleBellClick}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
                title={`${notificationCount} novas mensagens`}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white font-mono tabular-nums">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenCreateListing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Publicar Anúncio</span>
              </button>

              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <div
                  onClick={() => setActiveTab('profile')}
                  className="h-9 w-9 rounded-lg ring-2 ring-indigo-50 flex items-center justify-center bg-indigo-50 text-indigo-700 overflow-hidden cursor-pointer hover:opacity-90 transition shrink-0"
                  title={currentUser.name}
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
                  type="button"
                  onClick={onLogout}
                  title="Terminar sessão"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center space-x-1 px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="hidden sm:inline-flex items-center space-x-1 px-3.5 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer whitespace-nowrap"
              >
                <span>Criar Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Tab Bar */}
      <div className="flex md:hidden border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'explore'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Explorar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Kuenda AI
        </button>

        {currentUser && (
          <>
            <button
              type="button"
              onClick={() => {
                setActiveTab('messages');
                if (onResetNotifications) onResetNotifications();
              }}
              className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Mensagens
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seller')}
              className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'seller'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Vendedor
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'admin'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Gestor
        </button>
      </div>
    </header>
  );
}
