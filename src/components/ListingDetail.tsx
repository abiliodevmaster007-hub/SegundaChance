import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Listing, AiPriceAnalysis } from '../types';
import { getApiUrl } from '../apiConfig';
import {
  X,
  MapPin,
  MessageSquare,
  Shield,
  CheckCircle,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface ListingDetailProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onContactSeller: (listing: Listing) => void;
  isCurrentUserSeller: boolean;
}

export default function ListingDetail({
  listing,
  isOpen,
  onClose,
  onContactSeller,
  isCurrentUserSeller,
}: ListingDetailProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AiPriceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const formatKwanza = (val: number) => {
    return Math.round(val).toLocaleString('pt-PT') + ' Kz';
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'novo':
        return 'Novo (Nunca usado)';
      case 'excelente':
        return 'Excelente (Como novo)';
      case 'bom_estado':
        return 'Bom Estado (Marcas ligeiras)';
      case 'usado':
      default:
        return 'Usado (Marcas visíveis)';
    }
  };

  const handleEvaluatePriceWithAi = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(getApiUrl('/api/ai/price-analysis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          category: listing.category,
          location: listing.location,
          condition: listing.condition,
          currentPriceKz: listing.price,
          draftTitle: listing.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.priceAnalysis);
      }
    } catch (e) {
      // Silencioso
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row my-8 max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/20 text-white md:bg-white md:text-slate-500 md:border md:border-slate-200 hover:bg-slate-100 transition shadow cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Product Image */}
        <div className="w-full md:w-1/2 bg-slate-900 relative aspect-video md:aspect-auto min-h-[250px] md:min-h-full">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {listing.status === 'vendido' && (
            <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center backdrop-blur-[1px]">
              <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm tracking-wider uppercase shadow-xl flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Anúncio Vendido</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="text-xs font-medium text-slate-500 mb-1.5">
            <span>Categoria: {listing.category}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{listing.location}</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900 leading-tight">
            {listing.title}
          </h2>

          <div className="mt-3 py-2 px-3.5 bg-slate-50 border border-slate-200/80 rounded-lg self-start">
            <span className="text-xs text-slate-500 block">Preço Pedido</span>
            <span className="text-2xl font-bold text-indigo-600 font-mono tabular-nums">
              {formatKwanza(listing.price)}
            </span>
          </div>

          {/* Consultor de Preço Justo e Segurança Kuenda AI */}
          <div className="mt-4">
            {!aiAnalysis ? (
              <button
                type="button"
                disabled={analyzing}
                onClick={handleEvaluatePriceWithAi}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>A auditar preço no mercado angolano...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span>Avaliar Preço Justo & Segurança com Kuenda AI</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Auditoria Kuenda AI</span>
                  <span
                    className={`font-semibold ${
                      aiAnalysis.verdict === 'PRECO_JUSTO'
                        ? 'text-emerald-700'
                        : aiAnalysis.verdict === 'ABAIXO_DO_MERCADO'
                        ? 'text-indigo-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {aiAnalysis.verdict === 'PRECO_JUSTO'
                      ? 'Preço Justo'
                      : aiAnalysis.verdict === 'ABAIXO_DO_MERCADO'
                      ? 'Abaixo da Média'
                      : 'Acima da Média'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{aiAnalysis.explanation}</p>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/70 text-xs">
                  <div>
                    <span className="text-slate-500 block">Mínimo</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {formatKwanza(aiAnalysis.minPriceKz)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Média</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {formatKwanza(aiAnalysis.avgPriceKz)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ótimo</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700">
                      {formatKwanza(aiAnalysis.suggestedOptimalPriceKz)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
            <div>
              <span className="text-xs font-medium text-slate-400">Estado do Artigo</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {getConditionLabel(listing.condition)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Localização</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{listing.location}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex-1">
            <h4 className="text-xs font-semibold text-slate-500 mb-2">Descrição do Artigo</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              {listing.description}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-display uppercase">
                  {listing.sellerName.charAt(0)}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Vendedor</span>
                  <span className="text-sm font-bold text-slate-800">{listing.sellerName}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Contacto</span>
                <span className="text-xs font-semibold text-slate-700 font-mono tabular-nums">
                  {listing.sellerPhone}
                </span>
              </div>
            </div>

            {isCurrentUserSeller ? (
              <div className="text-center p-3.5 bg-amber-50 rounded-xl text-amber-800 text-xs font-medium border border-amber-100">
                Este é o seu próprio anúncio. Pode geri-lo e analisar a performance no seu Painel de Vendedor.
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => onContactSeller(listing)}
                  disabled={listing.status === 'vendido'}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm hover:bg-indigo-700 transition disabled:opacity-50 shadow cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  <span>Iniciar Conversa com o Vendedor</span>
                </button>

                <div className="flex items-center justify-center space-x-1.5 text-slate-500 text-xs">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Combine em local público e pague apenas após testar o artigo.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
