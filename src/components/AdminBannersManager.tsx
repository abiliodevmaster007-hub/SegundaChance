import React, { useState } from 'react';
import { AdBanner } from '../types';
import { PlusCircle, ToggleLeft, ToggleRight, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminBannersManagerProps {
  banners: AdBanner[];
  onCreateBanner: (banner: Omit<AdBanner, 'id' | 'createdAt'>) => void;
  onToggleBanner: (bannerId: string) => void;
  onDeleteBanner: (bannerId: string) => void;
}

export default function AdminBannersManager({
  banners,
  onCreateBanner,
  onToggleBanner,
  onDeleteBanner,
}: AdminBannersManagerProps) {
  const [bannerForm, setBannerForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    position: 'lateral' as 'lateral' | 'topo',
    active: true,
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.imageUrl || !bannerForm.targetUrl) {
      setFeedback({
        type: 'error',
        text: 'Por favor, preencha todos os campos do banner publicitário.',
      });
      return;
    }

    onCreateBanner(bannerForm);
    setBannerForm({
      title: '',
      imageUrl: '',
      targetUrl: '',
      position: 'lateral',
      active: true,
    });
    setFeedback({
      type: 'success',
      text: 'Banner publicitário criado e adicionado à rotação com sucesso!',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form block */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs h-fit">
        <h3 className="font-display font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
          <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Novo Banner</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5 font-semibold">
          Adicione publicidade rotativa de parceiros comerciais para gerar receita ativa na SegundaChance Angola.
        </p>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateBannerSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Título do Banner
            </label>
            <input
              type="text"
              placeholder="Ex: Novo Condomínio Kilamba — Reserve Já!"
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              URL da Imagem (Proporção Quadrada)
            </label>
            <input
              type="text"
              placeholder="Introduza um link de imagem do Unsplash ou Web"
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Link de Destino Completo
            </label>
            <input
              type="url"
              placeholder="https://exemplo.co.ao"
              value={bannerForm.targetUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Posicionamento
              </label>
              <select
                value={bannerForm.position}
                onChange={(e) =>
                  setBannerForm({
                    ...bannerForm,
                    position: e.target.value as 'lateral' | 'topo',
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold outline-none"
              >
                <option value="lateral">Coluna Lateral</option>
                <option value="topo">Topo Banner</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Publicar Ativo
              </label>
              <select
                value={bannerForm.active ? 'true' : 'false'}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, active: e.target.value === 'true' })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 font-bold outline-none"
              >
                <option value="true">Imediato (Ativo)</option>
                <option value="false">Rascunho (Inativo)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition cursor-pointer"
          >
            Criar Anúncio de Pub
          </button>
        </form>
      </div>

      {/* Existing list section */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
          Banners em Rotação ({banners.length})
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {banners.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold">
              Nenhum banner publicitário criado.
            </div>
          ) : (
            banners.map((ban) => (
              <div
                key={ban.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={ban.imageUrl}
                    alt={ban.title}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                        Posição: {ban.position}
                      </span>
                      <span aria-hidden="true">·</span>
                      {ban.active ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Ativo (Visível)
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-500">Inativo</span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                      {ban.title}
                    </h4>
                    <a
                      href={ban.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate inline-block max-w-[240px] hover:underline"
                    >
                      {ban.targetUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleBanner(ban.id)}
                    className="p-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    {ban.active ? (
                      <ToggleRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-400" />
                    )}
                    <span>Alternar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteBanner(ban.id)}
                    className="p-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg transition cursor-pointer"
                    title="Eliminar banner"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
