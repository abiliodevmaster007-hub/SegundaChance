import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ANGOLA_PROVINCES,
  CATEGORIES,
  CONDITIONS,
  ListingPrefillData,
  AiPriceAnalysis,
} from '../types';
import { X, Camera, AlertCircle, Sparkles, Check, Loader2, TrendingUp, Wand2 } from 'lucide-react';
import { getApiUrl } from '../apiConfig';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authToken: string;
  initialDraft?: ListingPrefillData | null;
}

export default function CreateListingModal({
  isOpen,
  onClose,
  onSuccess,
  authToken,
  initialDraft,
}: CreateListingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.id || 'tecnologia');
  const [condition, setCondition] = useState('excelente');
  const [location, setLocation] = useState('Luanda');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [priceInsight, setPriceInsight] = useState<AiPriceAnalysis | null>(null);

  useEffect(() => {
    if (initialDraft && isOpen) {
      setTitle(initialDraft.title || '');
      setDescription(initialDraft.description || '');
      setPrice(initialDraft.price ? String(initialDraft.price) : '');
      if (initialDraft.category) setCategory(initialDraft.category);
      if (initialDraft.condition) setCondition(initialDraft.condition);
      if (initialDraft.location) setLocation(initialDraft.location);
      setAiNotice('Rascunho otimizado pelo Kuenda AI aplicado automaticamente.');
    }
  }, [initialDraft, isOpen]);

  if (!isOpen) return null;

  const formatKz = (val: number) => `${Math.round(val).toLocaleString('pt-PT')} Kz`;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem é demasiado grande. Por favor escolha uma imagem com menos de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.onerror = () => {
      setError('Falha ao processar imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestImage = (url: string) => {
    setImageUrl(url);
  };

  const getCategorySuggestions = () => {
    switch (category) {
      case 'tecnologia':
        return [
          { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80' },
          { label: 'Laptop', url: 'https://images.unsplash.com/photo-1496181130204-7552aa15439d?w=600&auto=format&fit=crop&q=80' }
        ];
      case 'moda':
        return [
          { label: 'Calçado', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
          { label: 'Relógio', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' }
        ];
      case 'casa':
        return [
          { label: 'Planta Interior', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80' },
          { label: 'Decoração', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80' }
        ];
      case 'veiculos':
        return [
          { label: 'Carro', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80' },
          { label: 'Mota', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80' }
        ];
      case 'desporto':
        return [
          { label: 'Sapatilhas Corrida', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80' },
          { label: 'Bicicleta', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80' }
        ];
      default:
        return [
          { label: 'Câmara Retro', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80' },
          { label: 'Mochila', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80' }
        ];
    }
  };

  // Ferramenta Spring AI 1: Gerar e Otimizar Anúncio Automaticamente
  const handleOptimizeWithAi = async () => {
    setError(null);
    setAiNotice(null);
    setAiLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/ai/optimize-listing'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          draftTitle: title || `Artigo de ${category}`,
          draftNotes: description,
          category,
          condition,
          location,
          currentPriceKz: price ? Number(price) : undefined,
        }),
      });
      const data = await res.json();
      if (data.optimizedDraft) {
        setTitle(data.optimizedDraft.suggestedTitle);
        setDescription(data.optimizedDraft.suggestedDescription);
        setCategory(data.optimizedDraft.suggestedCategory || category);
        if (!price && data.optimizedDraft.suggestedPriceKz) {
          setPrice(String(data.optimizedDraft.suggestedPriceKz));
        }
        if (data.priceAnalysis) {
          setPriceInsight(data.priceAnalysis);
        }
        setAiNotice(
          `Anúncio otimizado com sucesso! Preço competitivo recomendado: ${formatKz(
            data.optimizedDraft.suggestedPriceKz
          )}.`
        );
      }
    } catch (e) {
      setError('Não foi possível contactar o otimizador de IA neste momento.');
    } finally {
      setAiLoading(false);
    }
  };

  // Ferramenta Spring AI 2: Precificação Inteligente em Kwanzas
  const handleAnalyzePriceWithAi = async () => {
    setError(null);
    setAiLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/ai/price-analysis'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          draftTitle: title,
          category,
          condition,
          location,
          currentPriceKz: price ? Number(price) : undefined,
        }),
      });
      const data = await res.json();
      if (data.priceAnalysis) {
        setPriceInsight(data.priceAnalysis);
        if (!price) {
          setPrice(String(data.priceAnalysis.suggestedOptimalPriceKz));
        }
      }
    } catch (e) {
      setError('Não foi possível calcular a referência de preço em Kwanzas.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !price || !imageUrl) {
      setError('Por favor preencha todos os campos obrigatórios e adicione uma imagem.');
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError('Por favor introduza um preço válido maior do que 0.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/listings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          condition,
          location,
          imageUrl
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar o anúncio.');
      }

      onSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setPriceInsight(null);
      setAiNotice(null);
    } catch (err: any) {
      setError(err.message || 'Erro de rede inesperado.');
    } finally {
      setLoading(false);
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
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <div className="h-1.5 w-full bg-indigo-600 rounded-t-2xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                O que quer vender hoje?
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Use as ferramentas do Kuenda AI abaixo para preencher ou calcular o preço ideal em Kwanzas.
              </p>
            </div>
          </div>

          {/* Barra de Ferramentas Spring AI para Vendedor */}
          <div className="mb-5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-800">
                Assistente Kuenda AI para Vendedores
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleOptimizeWithAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  <span>Otimizar Título & Descrição com IA</span>
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleAnalyzePriceWithAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Sugerir Preço em Kwanzas</span>
                </button>
              </div>
            </div>

            {aiNotice && (
              <div className="text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-2">
                {aiNotice}
              </div>
            )}

            {priceInsight && (
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Referência de Mercado ({priceInsight.category} · {priceInsight.location})
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrice(String(priceInsight.suggestedOptimalPriceKz))}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer whitespace-nowrap"
                  >
                    Aplicar {formatKz(priceInsight.suggestedOptimalPriceKz)}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Mínimo</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {formatKz(priceInsight.minPriceKz)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Média</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {formatKz(priceInsight.avgPriceKz)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sugerido IA</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700">
                      {formatKz(priceInsight.suggestedOptimalPriceKz)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 ring-1 ring-red-100">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Título do Anúncio *
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: iPhone 13 Pro 128GB como novo"
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Estado *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond.id} value={cond.id}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Preço Pedido (Kz) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 120000"
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 font-mono tabular-nums outline-none transition focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Província *
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500"
                >
                  {ANGOLA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Foto do Artigo (Upload ou Link)
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={imageUrl.startsWith('data:image') ? 'Imagem carregada comercialmente' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Cole o URL da imagem..."
                      disabled={imageUrl.startsWith('data:image')}
                      className="w-full rounded-xl border border-slate-200 py-3 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 bg-slate-50/50"
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute right-2.5 top-2.5 text-[10px] text-red-500 underline hover:text-red-700"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer select-none">
                    <Camera className="h-5 w-5 shrink-0" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block mb-2">
                Ou escolha uma fotografia de referência para a categoria:
              </span>
              <div className="flex flex-wrap gap-2">
                {getCategorySuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestImage(suggestion.url)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
                      imageUrl === suggestion.url
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {imageUrl === suggestion.url && <Check className="h-3 w-3" />}
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {imageUrl && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={imageUrl}
                  alt="Pré-visualização do Anúncio"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-3">
                  <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pré-visualização do Artigo</span>
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Descrição Detalhada *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indique os pormenores, estado de conservação, acessórios incluídos e modo de entrega..."
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 bg-slate-50/50 resize-none font-sans"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full select-none rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/10 whitespace-nowrap"
              >
                {loading ? 'A publicar anúncio...' : 'Publicar Anúncio Agora'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
