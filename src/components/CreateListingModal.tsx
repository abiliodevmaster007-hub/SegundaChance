import React, { useState } from 'react';
import { ANGOLA_PROVINCES, CATEGORIES, CONDITIONS } from '../types';
import { X, Camera, AlertCircle, Sparkles, Check } from 'lucide-react';
import { getApiUrl } from '../apiConfig';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authToken: string;
}

export default function CreateListingModal({
  isOpen,
  onClose,
  onSuccess,
  authToken
}: CreateListingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.id || 'tecnologia');
  const [condition, setCondition] = useState('excelente');
  const [location, setLocation] = useState('Luanda');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handles either file drag / select & converting to Base64
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

  // Pre-seed image suggestions depending on category to make testing lovely
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
      // Reset forms
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
    } catch (err: any) {
      setError(err.message || 'Erro de rede inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header Decorator */}
        <div className="h-1.5 w-full bg-indigo-600 rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Form Body Wrapper with Scroll */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-display text-2xl font-bold text-slate-900">
              O que quer vender hoje?
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Descreva o seu artigo de forma clara para vender mais rapidamente.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 ring-1 ring-red-100">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
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

            {/* Split Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none bg-slate-50/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Estado *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none bg-slate-50/50"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond.id} value={cond.id}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Preço Pedido (Kz) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 120000"
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Location & Image Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Província *
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 bg-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none bg-slate-50/50"
                >
                  {ANGOLA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
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
                      className="w-full rounded-xl border border-slate-200 py-3 px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50"
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

            {/* Quick Suggestions for Testing */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Ou escolha uma foto modelo de teste rápido:
              </span>
              <div className="flex flex-wrap gap-2">
                {getCategorySuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestImage(suggestion.url)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center space-x-1 ${
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

            {/* Image Preview Box */}
            {imageUrl && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={imageUrl}
                  alt="Anúncio Imagem de Pré-visualização"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-3">
                  <span className="text-white text-[11px] font-bold tracking-wider uppercase drop-shadow flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pré-Visualização do Espetáculo do Artigo</span>
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Descrição Detalhada *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indique os pormenores, estado de conservação, acessórios incluídos, modo de entrega e o motivo da venda..."
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 bg-slate-50/50 resize-none font-sans"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full select-none rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-98"
              >
                {loading ? 'A criar anúncio seguro...' : 'Publicar Anúncio Agora 🚀'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
