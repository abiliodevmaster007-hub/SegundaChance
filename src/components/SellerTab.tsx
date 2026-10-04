import React, { useState } from 'react';
import { Listing, AiSellerDiagnostic } from '../types';
import { getApiUrl } from '../apiConfig';
import {
  FolderOpen,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Briefcase,
  Trash2,
  Loader2,
  BarChart3,
  PlusCircle,
} from 'lucide-react';

interface SellerTabProps {
  sellerListings: Listing[];
  sellerListingsLoading: boolean;
  onCreateListingClick: () => void;
  onToggleListingStatus: (id: string, currentStatus: string) => void;
  onDeleteListing: (id: string) => void;
  sellerId?: string;
  authToken?: string | null;
}

export default function SellerTab({
  sellerListings,
  sellerListingsLoading,
  onCreateListingClick,
  onToggleListingStatus,
  onDeleteListing,
  sellerId,
  authToken,
}: SellerTabProps) {
  const [diagnostic, setDiagnostic] = useState<AiSellerDiagnostic | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const totalSellerListingsCount = sellerListings.length;
  const soldListingsCount = sellerListings.filter((l) => l.status === 'vendido').length;
  const activeListingsCount = totalSellerListingsCount - soldListingsCount;
  const estimatedRevenue = sellerListings
    .filter((l) => l.status === 'vendido')
    .reduce((sum, l) => sum + l.price, 0);

  const handleRunSellerDiagnostics = async () => {
    setDiagnosing(true);
    try {
      const token = authToken || localStorage.getItem('sc_token');
      const res = await fetch(getApiUrl('/api/ai/seller-diagnostics'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sellerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data.sellerDiagnostic);
      }
    } catch (e) {
      // Silencioso
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
      {/* Header / Stats Panel */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 leading-tight tracking-tight">
              Painel do Vendedor
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie os seus anúncios e utilize o diagnóstico Spring AI para acelerar as suas vendas em Angola.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={diagnosing}
              onClick={handleRunSellerDiagnostics}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              {diagnosing ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <BarChart3 className="h-4 w-4 text-indigo-600" />
              )}
              <span>Diagnosticar Vendas com IA</span>
            </button>
            <button
              type="button"
              onClick={onCreateListingClick}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Novo Anúncio</span>
            </button>
          </div>
        </div>

        {/* Grid of indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Total Publicado</span>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {totalSellerListingsCount}
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100">
              <FolderOpen className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Ativos à Venda</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                {activeListingsCount}
              </p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Marcados Vendidos</span>
              <p className="text-2xl font-bold text-slate-700 font-mono tabular-nums mt-1">
                {soldListingsCount}
              </p>
            </div>
            <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Receita Concluída</span>
              <p className="text-xl font-bold text-indigo-600 font-mono tabular-nums mt-1.5">
                {estimatedRevenue.toLocaleString('pt-PT')} Kz
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Painel de Diagnóstico de Performance Kuenda AI */}
        {diagnostic && (
          <div className="mt-6 p-5 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-500">
                  Relatório Kuenda AI · Taxa de Conversão: {diagnostic.conversionRatePercent}%
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Diagnóstico de Performance e Dicas de Venda
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                Estado da Conta: {diagnostic.overallHealth}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  Dicas Práticas para Vender Mais Rápido:
                </span>
                {diagnostic.actionableInsights.map((tip, idx) => (
                  <p key={idx} className="text-xs text-slate-600 leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  Auditoria de Preços em Kwanzas (Kz):
                </span>
                {diagnostic.pricingAlerts.length === 0 ? (
                  <p className="text-xs text-emerald-700">
                    • Todos os seus anúncios ativos estão dentro da faixa competitiva de mercado.
                  </p>
                ) : (
                  diagnostic.pricingAlerts.map((alert, idx) => (
                    <p key={idx} className="text-xs text-amber-800 leading-relaxed">
                      • {alert}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List of custom advertisements */}
      <h2 className="font-display text-base font-bold text-slate-800 mb-4">
        Os Meus Anúncios Atuais
      </h2>

      {sellerListingsLoading ? (
        <div className="flex py-10 items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : sellerListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-slate-800 text-sm">
            Ainda não tem nenhum anúncio publicado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Venda os seus pertences em Angola de forma rápida, segura e com otimização automática por IA.
          </p>
          <button
            onClick={onCreateListingClick}
            className="mt-4 inline-flex items-center space-x-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap"
          >
            Criar o seu Primeiro Anúncio
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {sellerListings.map((list) => (
            <div
              key={list.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={list.imageUrl}
                  alt={list.title}
                  className="h-16 w-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-xs text-slate-500">
                    <span className={list.status === 'vendido' ? 'text-slate-500 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {list.status === 'vendido' ? 'Vendido' : 'Ativo'}
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{list.location}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(list.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{list.title}</h4>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5 font-mono tabular-nums">
                    {list.price.toLocaleString('pt-PT')} Kz
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleListingStatus(list.id, list.status)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer border whitespace-nowrap ${
                    list.status === 'vendido'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{list.status === 'vendido' ? 'Reativar Artigo' : 'Marcar como Vendido'}</span>
                </button>

                <button
                  onClick={() => onDeleteListing(list.id)}
                  className="p-2 sm:p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
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
