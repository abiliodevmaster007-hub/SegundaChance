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
  Sun,
  Moon,
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
  darkMode: boolean;
  onToggleDarkMode: () => void;
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
  darkMode,
  onToggleDarkMode,
}: HeaderProps) {
  const handleBellClick = () => {
    setActiveTab('messages');
    if (onResetNotifications) {
      onResetNotifications();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition cursor-pointer whitespace-nowrap"
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
                ? 'border-indigo-600 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Explorar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-1 text-sm font-medium transition border-b-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Kuenda AI</span>
          </button>

          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`py-1 text-sm font-medium transition border-b-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'messages'
                    ? 'border-indigo-600 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
                    ? 'border-indigo-600 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Gestor Central</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions + Theme Toggle */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Botão de Alternância de Tema Escuro / Claro */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label={darkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-amber-400 transition cursor-pointer"
          >
            {darkMode ? (
              <Sun className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-600" />
            )}
          </button>

          {currentUser ? (
            <>
              <button
                type="button"
                onClick={handleBellClick}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition cursor-pointer"
                title={`${notificationCount} novas mensagens`}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 font-mono tabular-nums">
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

              <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                <div
                  onClick={() => setActiveTab('profile')}
                  className="h-9 w-9 rounded-lg ring-2 ring-indigo-50 dark:ring-slate-800 flex items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 overflow-hidden cursor-pointer hover:opacity-90 transition shrink-0"
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
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
                className="inline-flex items-center space-x-1 px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
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
      <div className="flex md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'explore'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400'
          }`}
        >
          Explorar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400'
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
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              Mensagens
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seller')}
              className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'seller'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
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
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400'
          }`}
        >
          Gestor
        </button>
      </div>
    </header>
  );
}
