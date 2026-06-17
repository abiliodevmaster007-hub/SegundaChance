import React, { useState } from 'react';
import { Listing, AdBanner, AdminDashboardStats } from '../types';
import { 
  Users, 
  Layers, 
  Megaphone, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  ShieldAlert
} from 'lucide-react';
import AdminBannersManager from './AdminBannersManager';

interface AdminPanelProps {
  stats: AdminDashboardStats;
  listings: Listing[];
  banners: AdBanner[];
  onUpdateListingStatus: (listingId: string, status: 'disponivel' | 'vendido' | 'suspenso') => void;
  onDeleteListing: (listingId: string) => void;
  onCreateBanner: (banner: Omit<AdBanner, 'id' | 'createdAt'>) => void;
  onToggleBanner: (bannerId: string) => void;
  onDeleteBanner: (bannerId: string) => void;
}

export default function AdminPanel({
  stats,
  listings,
  banners,
  onUpdateListingStatus,
  onDeleteListing,
  onCreateBanner,
  onToggleBanner,
  onDeleteBanner
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'listings' | 'banners'>('dashboard');

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Cabeçalho do Painel Admin */}
      <div className="mb-8 border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <ShieldAlert className="h-7 w-7 text-red-600 animate-pulse" />
              <span>Painel Geral do Administrador</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-semibold">
              Ponto de Gestão Central da SegundaChance Angola — Moderar anúncios, gerir publicidades e acompanhar métricas.
            </p>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-center font-mono">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSection === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveSection('listings')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSection === 'listings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              Gerir Anúncios ({listings.length})
            </button>
            <button
              onClick={() => setActiveSection('banners')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSection === 'banners' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              Gerir Publicidade ({banners.length})
            </button>
          </div>
        </div>
      </div>

      {/* SECTOR 1: DASHBOARD DE MÉTRICAS */}
      {activeSection === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Utilizadores Inscritos</span>
                <p className="text-2xl font-black text-slate-900 font-display mt-0.5">{stats.totalUsers}</p>
                <span className="text-[9px] text-slate-400 font-bold font-mono">GET /api/admin/dashboard</span>
              </div>
              <div className="h-11 w-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Users className="h-5.5 w-5.5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Desapegos Ativos</span>
                <p className="text-2xl font-black text-indigo-600 font-display mt-0.5">{stats.activeListings}</p>
                <span className="text-[9px] text-slate-400 font-bold font-mono">Spring Boot JPA</span>
              </div>
              <div className="h-11 w-11 bg-indigo-50/70 rounded-xl flex items-center justify-center text-indigo-700 shadow-sm">
                <Layers className="h-5.5 w-5.5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Publicidades Ativas</span>
                <p className="text-2xl font-black text-emerald-600 font-display mt-0.5">{stats.activeBanners}</p>
                <span className="text-[9px] text-slate-400 font-bold font-mono">Banners Rodando</span>
              </div>
              <div className="h-11 w-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                <Megaphone className="h-5.5 w-5.5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Mensagens Hoje (WS)</span>
                <p className="text-2xl font-black text-amber-600 font-display mt-0.5">{stats.messagesSentToday}</p>
                <span className="text-[9px] text-slate-400 font-bold font-mono">STOMP over SockJS</span>
              </div>
              <div className="h-11 w-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                <MessageSquare className="h-5.5 w-5.5" />
              </div>
            </div>

          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-850 shadow-md">
            <h3 className="font-display font-black text-base text-indigo-400 uppercase tracking-wider mb-2">Comunicação e Arquitetura do Futuro Back-end Spring Boot</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-medium">
              Este dashboard está desenhado para se alimentar de <code className="bg-slate-800 text-indigo-350 px-1.5 py-0.5 rounded font-mono">GET /api/admin/dashboard</code>. No Spring Boot, utilize repositórios Spring Data JPA para consultar as bases de dados usando consultas agregadas nativas ou JPQL para contar utilizadores, contagem de desapegos no estado activo e banners. Para a estatística de Mensagens enviadas, podes usar um listener STOMP ou Spring Redis para gravar contadores diários voláteis altamente eficientes.
            </p>
          </div>
        </div>
      )}

      {/* SECTOR 2: GESTÃO DE ANÚNCIOS */}
      {activeSection === 'listings' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-base font-extrabold text-slate-850 uppercase tracking-widest leading-none">Controlo de Moderador</h2>
            <span className="text-[10px] bg-white text-slate-500 font-mono font-bold px-2.5 py-1 rounded-md border border-slate-200/50 uppercase tracking-wider shadow-xs">
              {listings.length} anúncios no sistema
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {listings.length === 0 ? (
              <div className="p-8 text-center text-slate-450 font-bold">
                Nenhum anúncio registado no sistema de momento.
              </div>
            ) : (
              listings.map((list) => (
                <div key={list.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={list.imageUrl}
                      alt={list.title}
                      className="h-14 w-14 rounded-xl object-cover border border-slate-150 shrink-0 bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-150 px-1 py-0.5 rounded uppercase tracking-wider font-mono">{list.category}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider">Vendedor: {list.sellerName}</span>
                        <span className="text-slate-350">•</span>
                        {list.status === 'vendido' ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100 font-mono">
                            Suspenso / Terminado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100 font-mono">
                            Público
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">{list.title}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{list.price.toLocaleString('pt-PT')} Kz — {list.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onUpdateListingStatus(list.id, list.status === 'vendido' ? 'disponivel' : 'vendido')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        list.status === 'vendido'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-110'
                          : 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-110'
                      }`}
                      title={list.status === 'vendido' ? 'Aprovar e Publicar' : 'Suspender anúncio'}
                    >
                      {list.status === 'vendido' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span>{list.status === 'vendido' ? 'Tornar Ativo' : 'Alternar Público'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteListing(list.id)}
                      className="p-2 sm:p-2 border border-red-200 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg transition cursor-pointer"
                      title="Eliminar permanentemente da BD"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTOR 3: GESTÃO DE BANNERS PUBLICITÁRIOS */}
      {activeSection === 'banners' && (
        <AdminBannersManager 
          banners={banners}
          onCreateBanner={onCreateBanner}
          onToggleBanner={onToggleBanner}
          onDeleteBanner={onDeleteBanner}
        />
      )}

    </div>
  );
}
