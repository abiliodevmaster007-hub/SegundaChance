import React from 'react';
import { Listing } from '../types';
import { FolderOpen, TrendingUp, CheckCircle, DollarSign, Briefcase, Trash2, Loader2 } from 'lucide-react';

interface SellerTabProps {
  sellerListings: Listing[];
  sellerListingsLoading: boolean;
  onCreateListingClick: () => void;
  onToggleListingStatus: (id: string, currentStatus: string) => void;
  onDeleteListing: (id: string) => void;
}

export default function SellerTab({
  sellerListings,
  sellerListingsLoading,
  onCreateListingClick,
  onToggleListingStatus,
  onDeleteListing
}: SellerTabProps) {
  // Computing stats for seller dashboard
  const totalSellerListingsCount = sellerListings.length;
  const soldListingsCount = sellerListings.filter(l => l.status === 'vendido').length;
  const activeListingsCount = totalSellerListingsCount - soldListingsCount;
  const estimatedRevenue = sellerListings
    .filter(l => l.status === 'vendido')
    .reduce((sum, l) => sum + l.price, 0);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
      {/* Header / Stats Panel */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">Painel de Vendedor</h1>
        <p className="text-sm text-slate-500 mt-1 font-semibold">Monitorize as suas listagens de vestuário, gadgets e outros e ganhe dinheiro fácil desapegando.</p>
        
        {/* Grid of indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Publicado</span>
              <p className="text-2xl font-black text-slate-905 font-display mt-1">{totalSellerListingsCount}</p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100">
              <FolderOpen className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Activos à Venda</span>
              <p className="text-2xl font-black text-emerald-600 font-display mt-1">{activeListingsCount}</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-404">Marcados Vendidos</span>
              <p className="text-2xl font-black text-slate-500 font-display mt-1">{soldListingsCount}</p>
            </div>
            <div className="h-10 w-10 bg-slate-55 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Receita Estimada</span>
              <p className="text-xl font-black text-indigo-650 font-display mt-1.5">{estimatedRevenue.toLocaleString('pt-PT')} Kz</p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-650 border border-indigo-100">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* List of custom advertisements */}
      <h2 className="font-display text-base font-black text-slate-800 mb-4 uppercase tracking-wider">Os Meus Anúncios Actuais</h2>

      {sellerListingsLoading ? (
        <div className="flex py-10 items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : sellerListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl shadow-xs">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-tight">Ainda não tem nenhum anúncio publicado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
            Venda os seus pertences que já não lhe servem em Angola de forma rápida, segura e totalmente grátis.
          </p>
          <button
            onClick={onCreateListingClick}
            className="mt-4 inline-flex items-center space-x-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer uppercase tracking-wider"
          >
            Criar o seu Primeiro Anúncio!
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {sellerListings.map((list) => (
            <div key={list.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
              
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
                  <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Criado em: {new Date(list.createdAt).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleListingStatus(list.id, list.status)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer border ${
                    list.status === 'vendido'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{list.status === 'vendido' ? 'Re-ativar Artigo' : 'Marcar como Vendido'}</span>
                </button>

                <button
                  onClick={() => onDeleteListing(list.id)}
                  className="p-2 sm:p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-750 transition cursor-pointer"
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
  );
}
