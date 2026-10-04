import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Listing,
  AiAssistantResponse,
  AiConversationEntry,
  ListingPrefillData,
  ANGOLA_PROVINCES,
  CATEGORIES,
} from '../types';
import { getApiUrl } from '../apiConfig';
import {
  Send,
  Loader2,
  ShoppingBag,
  Store,
  TrendingUp,
  ShieldCheck,
  FileEdit,
  Search,
  MessageSquare,
  ArrowUpRight,
  Copy,
  Check,
  BarChart3,
} from 'lucide-react';

interface AiAssistantTabProps {
  currentUser: User | null;
  authToken: string | null;
  onOpenListingDetail: (listing: Listing) => void;
  onContactSeller: (listing: Listing) => void;
  onApplyDraftToModal: (draft: ListingPrefillData) => void;
}

export default function AiAssistantTab({
  currentUser,
  authToken,
  onOpenListingDetail,
  onContactSeller,
  onApplyDraftToModal,
}: AiAssistantTabProps) {
  const [roleMode, setRoleMode] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [selectedProvince, setSelectedProvince] = useState<string>(currentUser?.location || 'Luanda');
  const [selectedCategory, setSelectedCategory] = useState<string>('tecnologia');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedReply, setCopiedReply] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ provider: string; model: string; availableTools: string[] } | null>(null);

  const [conversation, setConversation] = useState<AiConversationEntry[]>([
    {
      id: 'welcome_msg',
      sender: 'assistant',
      roleContext: 'BUYER',
      text: 'Bem-vindo ao Kuenda AI. Estou ligado em tempo real ao catálogo e às ferramentas de mercado em Angola para apoiar tanto Compradores como Vendedores. Escolha uma ferramenta abaixo ou escreva o que procura.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(getApiUrl('/api/ai/status'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAiStatus(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, loading]);

  const formatKz = (val: number) => `${Math.round(val).toLocaleString('pt-PT')} Kz`;

  const sendQueryToAi = async (customPrompt?: string, overrideRole?: 'BUYER' | 'SELLER') => {
    const promptText = (customPrompt !== undefined ? customPrompt : inputMessage).trim();
    if (!promptText || loading) return;

    const activeRole = overrideRole || roleMode;
    if (customPrompt === undefined) {
      setInputMessage('');
    }

    const userEntry: AiConversationEntry = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      roleContext: activeRole,
      text: promptText,
      createdAt: new Date().toISOString(),
    };

    setConversation((prev) => [...prev, userEntry]);
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(getApiUrl('/api/ai/chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: promptText,
          roleContext: activeRole,
          sellerId: currentUser?.id,
          category: selectedCategory,
          location: selectedProvince,
        }),
      });

      const data: AiAssistantResponse = await res.json();

      const assistantEntry: AiConversationEntry = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        roleContext: activeRole,
        text: data.reply || 'Análise concluída com base nos dados da plataforma.',
        responseMeta: data,
        createdAt: data.timestamp || new Date().toISOString(),
      };

      setConversation((prev) => [...prev, assistantEntry]);
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          roleContext: activeRole,
          text: 'Não foi possível comunicar com o motor de IA neste momento. Tente novamente em instantes.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReply = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedReply(text);
    setTimeout(() => setCopiedReply(null), 2000);
  };

  const buyerQuickTools = [
    {
      title: 'Busca Inteligente & Comparação',
      subtitle: 'Pesquisa ofertas reais no catálogo e compara custo-benefício',
      icon: Search,
      prompt: `Procurar e comparar as melhores ofertas de ${selectedCategory} disponíveis em ${selectedProvince}`,
    },
    {
      title: 'Avaliador de Preço Justo (Kz)',
      subtitle: 'Calcula mínimo, média e teto de mercado em Kwanzas',
      icon: TrendingUp,
      prompt: `Avaliar se o preço de 450000 Kz está justo para a categoria ${selectedCategory} em ${selectedProvince}`,
    },
    {
      title: 'Consultor de Negociação & Segurança',
      subtitle: 'Sugere contraproposta e checklist de verificação presencial',
      icon: ShieldCheck,
      prompt: `Quais são as melhores dicas de segurança e argumentos para negociar desconto numa compra em ${selectedProvince}?`,
    },
  ];

  const sellerQuickTools = [
    {
      title: 'Gerador e Otimizador de Anúncio',
      subtitle: 'Cria título apelativo, descrição estruturada e sugere preço em Kz',
      icon: FileEdit,
      prompt: `Gerar e otimizar um anúncio profissional para um artigo de ${selectedCategory} em excelente estado em ${selectedProvince}`,
    },
    {
      title: 'Diagnóstico de Performance de Vendas',
      subtitle: 'Audita os seus anúncios ativos, taxa de conversão e alertas de preço',
      icon: BarChart3,
      prompt: 'Realizar diagnóstico completo de performance sobre os meus anúncios e dar dicas para vender mais rápido',
    },
    {
      title: 'Respostas Rápidas para Negociação',
      subtitle: 'Gera 3 respostas cordiais e contrapropostas para fechar negócio no chat',
      icon: MessageSquare,
      prompt: 'Gerar sugestões de resposta para negociar com um comprador interessado no chat',
    },
  ];

  const activeTools = roleMode === 'BUYER' ? buyerQuickTools : sellerQuickTools;

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full bg-slate-50">
      {/* Painel Lateral de Controlo e Ferramentas de Servidor */}
      <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between overflow-y-auto shrink-0">
        <div className="space-y-6">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              <span>Spring AI Engine</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{aiStatus?.provider || 'HYBRID'}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>5 Ferramentas Ativas</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              Central Kuenda AI
            </h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Assistência 100% integrada com consulta real à base de dados para comprar com segurança ou vender mais rápido.
            </p>
          </div>

          {/* Seletor de Modo: Comprador vs Vendedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Perfil de Assistência Ativo
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setRoleMode('BUYER')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  roleMode === 'BUYER'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Modo Comprador</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleMode('SELLER')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  roleMode === 'SELLER'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Modo Vendedor</span>
              </button>
            </div>
          </div>

          {/* Contexto Geográfico e Categoria para Precisão das Tools */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Província Alvo
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
              >
                {ANGOLA_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Categoria Foco
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cartões de Ferramentas do Servidor (Function Calling) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="block text-xs font-semibold text-slate-500">
              {roleMode === 'BUYER'
                ? 'Ferramentas de Servidor para Compradores'
                : 'Ferramentas de Servidor para Vendedores'}
            </span>

            {activeTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => sendQueryToAi(tool.prompt, roleMode)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70 transition group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                        {tool.title}
                      </span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed pl-6">
                    {tool.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé Informativo do Motor Híbrido */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-700">Proteção & Transparência Kuenda</div>
          <p className="leading-relaxed">
            Cálculos baseados nos anúncios reais em Kwanzas (Kz). Nunca efetue pagamentos adiantados sem inspecionar o artigo.
          </p>
        </div>
      </aside>

      {/* Área Principal de Conversação e Resultados Estruturados das Ferramentas */}
      <section className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Stream de Mensagens e Cartões de Ferramentas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {conversation.map((entry) => {
            const isUser = entry.sender === 'user';
            const meta = entry.responseMeta;

            return (
              <div
                key={entry.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs mb-1.5 opacity-75">
                    <span>{isUser ? (currentUser?.name || 'Você') : 'Kuenda AI'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.roleContext === 'SELLER' ? 'Consultoria Vendedor' : 'Consultoria Comprador'}</span>
                    {meta?.toolsExecuted && meta.toolsExecuted.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {meta.toolsExecuted.length} ferramenta(s) acionada(s)
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-line">{entry.text}</p>

                  {/* 1. CARTÃO DE ANÁLISE DE PREÇO EM KWANZAS (TABULAR-NUMS) */}
                  {meta?.priceAnalysis && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                           Termómetro de Preço em Kwanzas ({meta.priceAnalysis.category} · {meta.priceAnalysis.location})
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            meta.priceAnalysis.verdict === 'PRECO_JUSTO'
                              ? 'text-emerald-700'
                              : meta.priceAnalysis.verdict === 'ABAIXO_DO_MERCADO'
                              ? 'text-indigo-700'
                              : 'text-amber-700'
                          }`}
                        >
                          Veredito:{' '}
                          {meta.priceAnalysis.verdict === 'PRECO_JUSTO'
                            ? 'Preço Justo de Mercado'
                            : meta.priceAnalysis.verdict === 'ABAIXO_DO_MERCADO'
                            ? 'Abaixo do Mercado (Oportunidade)'
                            : 'Acima da Média da Categoria'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-xs text-slate-500 block">Mínimo na Categoria</span>
                          <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5 block">
                            {formatKz(meta.priceAnalysis.minPriceKz)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-xs text-slate-500 block">Média de Mercado</span>
                          <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5 block">
                            {formatKz(meta.priceAnalysis.avgPriceKz)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                          <span className="text-xs text-emerald-800 block">Preço Ótimo Sugerido</span>
                          <span className="text-sm font-bold text-emerald-900 font-mono tabular-nums mt-0.5 block">
                            {formatKz(meta.priceAnalysis.suggestedOptimalPriceKz)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-xs text-slate-500 block">Teto da Categoria</span>
                          <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5 block">
                            {formatKz(meta.priceAnalysis.maxPriceKz)}
                          </span>
                        </div>
                      </div>

                      {meta.priceAnalysis.safetyTips && meta.priceAnalysis.safetyTips.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <span className="text-xs font-semibold text-slate-700 block">
                            Recomendações de Segurança Presencial:
                          </span>
                          {meta.priceAnalysis.safetyTips.map((tip, i) => (
                            <p key={i} className="text-xs text-slate-600 leading-relaxed">
                              • {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. CARTÃO DE RASCUNHO DE ANÚNCIO OTIMIZADO (1-CLICK APPLY) */}
                  {meta?.optimizedDraft && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          Rascunho Otimizado Pronto a Publicar
                        </span>
                        <span className="text-xs font-mono tabular-nums font-semibold text-indigo-700">
                          Preço Recomendado: {formatKz(meta.optimizedDraft.suggestedPriceKz)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="text-sm font-bold text-slate-900">
                          {meta.optimizedDraft.suggestedTitle}
                        </div>
                        <div className="text-xs text-slate-500">
                          <span>Categoria: {meta.optimizedDraft.suggestedCategory}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>Estado: {meta.optimizedDraft.suggestedCondition}</span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pt-1 border-t border-slate-200/60">
                          {meta.optimizedDraft.suggestedDescription}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onApplyDraftToModal({
                              title: meta.optimizedDraft!.suggestedTitle,
                              description: meta.optimizedDraft!.suggestedDescription,
                              price: meta.optimizedDraft!.suggestedPriceKz,
                              category: meta.optimizedDraft!.suggestedCategory,
                              condition: meta.optimizedDraft!.suggestedCondition,
                              location: selectedProvince,
                            })
                          }
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition whitespace-nowrap cursor-pointer"
                        >
                          Preencher e Publicar Anúncio com 1 Clique
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. CARTÃO DE DIAGNÓSTICO DO PORTFÓLIO DO VENDEDOR */}
                  {meta?.sellerDiagnostic && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">
                          Diagnóstico de Performance do Vendedor
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">
                          Saúde da Conta: {meta.sellerDiagnostic.overallHealth}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-xs text-slate-500 block">Anúncios Ativos</span>
                          <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                            {meta.sellerDiagnostic.activeListings} ({formatKz(meta.sellerDiagnostic.totalActiveValueKz)})
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-xs text-slate-500 block">Taxa de Conversão</span>
                          <span className="text-sm font-bold text-indigo-700 font-mono tabular-nums">
                            {meta.sellerDiagnostic.conversionRatePercent}%
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-xs text-slate-500 block">Receita Concluída</span>
                          <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                            {formatKz(meta.sellerDiagnostic.totalSoldRevenueKz)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {meta.sellerDiagnostic.actionableInsights.map((insight, idx) => (
                          <p key={idx} className="text-xs text-slate-600 leading-relaxed">
                            • {insight}
                          </p>
                        ))}
                        {meta.sellerDiagnostic.pricingAlerts.map((alert, idx) => (
                          <p key={idx} className="text-xs text-amber-800 font-medium leading-relaxed">
                            • Alerta de Preço: {alert}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. SUGESTÕES DE RESPOSTA PARA NEGOCIAÇÃO NO CHAT */}
                  {meta?.suggestedReplies && meta.suggestedReplies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-xs font-semibold text-slate-900 block">
                        Sugestões Prontas para Negociação no Chat (Clique para Copiar):
                      </span>
                      <div className="space-y-2">
                        {meta.suggestedReplies.map((rep, i) => (
                          <div
                            key={i}
                            onClick={() => handleCopyReply(rep)}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 flex items-center justify-between gap-3 cursor-pointer transition"
                          >
                            <span className="text-xs text-slate-700 leading-relaxed">{rep}</span>
                            {copiedReply === rep ? (
                              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. GRELHA DE OFERTAS ENCONTRADAS NO CATÁLOGO */}
                  {meta?.recommendedListings && meta.recommendedListings.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <span className="text-xs font-semibold text-slate-900 block">
                        Anúncios Encontrados e Comparados no Catálogo ({meta.recommendedListings.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {meta.recommendedListings.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3 justify-between"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="h-12 w-12 rounded-lg object-cover bg-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">
                                  {item.title}
                                </h4>
                                <p className="text-xs font-bold text-indigo-700 font-mono tabular-nums mt-0.5">
                                  {formatKz(item.price)}
                                </p>
                                <div className="text-[11px] text-slate-500 truncate">
                                  <span>{item.location}</span>
                                  <span className="mx-1" aria-hidden="true">·</span>
                                  <span>{item.condition}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onOpenListingDetail(item)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition whitespace-nowrap cursor-pointer"
                              >
                                Ver
                              </button>
                              <button
                                type="button"
                                onClick={() => onContactSeller(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition whitespace-nowrap cursor-pointer"
                              >
                                Negociar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500 p-3">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>O Kuenda AI está a consultar as ferramentas do servidor e o catálogo...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Barra de Entrada de Comando / Pergunta */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQueryToAi();
            }}
            className="max-w-4xl mx-auto flex items-center gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                roleMode === 'BUYER'
                  ? 'Ex: Procuro um iPhone ou portátil em Luanda até 500.000 Kz e quero avaliar se o preço é justo...'
                  : 'Ex: Quero criar um anúncio otimizado para vender um Sofá 3 lugares em Benguela...'
              }
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold transition inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Consultar IA</span>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
