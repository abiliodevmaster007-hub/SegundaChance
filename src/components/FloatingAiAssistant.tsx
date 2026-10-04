import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Listing, AiAssistantResponse, ListingPrefillData } from '../types';
import { getApiUrl } from '../apiConfig';
import { X, Send, Loader2, Bot, ArrowUpRight, ShoppingBag, Store } from 'lucide-react';

interface FloatingAiAssistantProps {
  currentUser: User | null;
  authToken: string | null;
  activeTab: string;
  onNavigateToFullAiTab: () => void;
  onOpenListingDetail: (listing: Listing) => void;
  onApplyDraftToModal: (draft: ListingPrefillData) => void;
}

export default function FloatingAiAssistant({
  currentUser,
  authToken,
  activeTab,
  onNavigateToFullAiTab,
  onOpenListingDetail,
  onApplyDraftToModal,
}: FloatingAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roleMode, setRoleMode] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AiAssistantResponse | null>(null);

  if (activeTab === 'ai') return null;

  const formatKz = (val: number) => `${Math.round(val).toLocaleString('pt-PT')} Kz`;

  const handleQuickAsk = async (customText?: string) => {
    const q = (customText !== undefined ? customText : prompt).trim();
    if (!q || loading) return;
    if (customText === undefined) setPrompt('');
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(getApiUrl('/api/ai/chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: q,
          roleContext: roleMode,
          sellerId: currentUser?.id,
          location: currentUser?.location || 'Luanda',
        }),
      });
      if (res.ok) {
        setLastResponse(await res.json());
      }
    } catch (e) {
      // Silencioso
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        <motion.button
          key="floating-btn"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-lg hover:bg-indigo-600 transition cursor-pointer whitespace-nowrap"
        >
          <Bot className="h-4 w-4 text-emerald-400" />
          <span>Assistente Kuenda AI</span>
        </motion.button>
      ) : (
        <motion.div
          key="floating-drawer"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden max-h-[82vh]"
        >
          {/* Topo da Gaveta */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-tight">Kuenda AI — Suporte Rápido</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToFullAiTab();
                }}
                className="text-[11px] font-medium text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Abrir Central Completa</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Seletor Comprador / Vendedor */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-lg w-full">
              <button
                type="button"
                onClick={() => setRoleMode('BUYER')}
                className={`py-1.5 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  roleMode === 'BUYER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                <span>Comprador</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleMode('SELLER')}
                className={`py-1.5 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  roleMode === 'SELLER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Store className="h-3.5 w-3.5 text-indigo-600" />
                <span>Vendedor</span>
              </button>
            </div>
          </div>

          {/* Corpo e Atalhos */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            <div className="flex flex-wrap gap-1.5">
              {roleMode === 'BUYER' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickAsk('Comparar ofertas de tecnologia em Luanda')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer whitespace-nowrap"
                  >
                    Comparar tecnologia em Luanda
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAsk('Avaliar preço justo de um iPhone 13 Pro')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer whitespace-nowrap"
                  >
                    Avaliar preço de iPhone
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickAsk('Gerar anúncio otimizado para vender rápido')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer whitespace-nowrap"
                  >
                    Gerar anúncio com IA
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAsk('Diagnosticar o desempenho dos meus anúncios')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer whitespace-nowrap"
                  >
                    Diagnosticar minhas vendas
                  </button>
                </>
              )}
            </div>

            {loading && (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>A consultar ferramentas Spring AI...</span>
              </div>
            )}

            {!loading && lastResponse && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs text-slate-700"
              >
                <p className="leading-relaxed whitespace-pre-line">{lastResponse.reply}</p>

                {lastResponse.priceAnalysis && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Referência de Mercado:</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700">
                      {formatKz(lastResponse.priceAnalysis.suggestedOptimalPriceKz)}
                    </span>
                  </div>
                )}

                {lastResponse.optimizedDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onApplyDraftToModal({
                        title: lastResponse.optimizedDraft!.suggestedTitle,
                        description: lastResponse.optimizedDraft!.suggestedDescription,
                        price: lastResponse.optimizedDraft!.suggestedPriceKz,
                        category: lastResponse.optimizedDraft!.suggestedCategory,
                        condition: lastResponse.optimizedDraft!.suggestedCondition,
                      });
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    Usar Rascunho no Formulário de Anúncio
                  </button>
                )}

                {lastResponse.recommendedListings && lastResponse.recommendedListings.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {lastResponse.recommendedListings.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          onOpenListingDetail(item);
                        }}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-medium text-slate-800 truncate pr-2">{item.title}</span>
                        <span className="font-mono tabular-nums font-bold text-indigo-600 shrink-0">
                          {formatKz(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Input Rápido */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickAsk();
            }}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pergunte sobre preços, anúncios ou ofertas..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
