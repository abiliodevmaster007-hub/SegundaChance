import React, { useState } from 'react';
import { AdBanner } from '../types';
import { PlusCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

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
  onDeleteBanner
}: AdminBannersManagerProps) {
  const [bannerForm, setBannerForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    position: 'lateral' as 'lateral' | 'topo',
    active: true
  });

  const handleCreateBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.imageUrl || !bannerForm.targetUrl) {
      alert('Por favor, preencha todos os campos do banner publicitário.');
      return;
    }

    onCreateBanner(bannerForm);
    setBannerForm({
      title: '',
      imageUrl: '',
      targetUrl: '',
      position: 'lateral',
      active: true
    });
    alert('Banner publicitário criado com sucesso!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      
      {/* Form block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-fit animate-slideUp">
        <h3 className="font-display font-black text-base text-slate-800 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
          <PlusCircle className="h-5 w-5 text-indigo-650" />
          <span>Novo Banner</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5 font-semibold">
          Adicione publicidade rotativa de parceiros comerciais para gerar receita ativa na SegundaChance Angola.
        </p>

        <form onSubmit={handleCreateBannerSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Título do Banner</label>
            <input
              type="text"
              placeholder="Ex: Novo Condomínio Kilamba — Reserve Já!"
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">URL da Imagem (Proporção Quadrada)</label>
            <input
              type="text"
              placeholder="Introduza um link de imagem do Unsplash ou Web"
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Link de Destino Completo</label>
            <input
              type="url"
              placeholder="https://exemplo.co.ao"
              value={bannerForm.targetUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2.5 text-xs text-slate-850 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Posicionamento</label>
              <select
                value={bannerForm.position}
                onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value as 'lateral' | 'topo' })}
                className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2.5 text-xs text-slate-850 font-bold outline-none"
              >
                <option value="lateral">Coluna Lateral</option>
                <option value="topo">Topo Banner</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Publicar Ativo</label>
              <select
                value={bannerForm.active ? 'true' : 'false'}
                onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.value === 'true' })}
                className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2.5 text-xs text-slate-850 font-bold outline-none"
              >
                <option value="true">Imediato (Ativo)</option>
                <option value="false">Rascunho (Inativo)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition"
          >
            Criar Anúncio de Pub
          </button>
        </form>
      </div>

      {/* Existing list section */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-display font-extrabold text-base text-slate-850 uppercase tracking-wider mb-2">Banners em Rotação</h3>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {banners.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold">
              Nenhum banner publicitário criado.
            </div>
          ) : (
            banners.map((ban) => (
              <div key={ban.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center space-x-4">
                  <img
                    src={ban.imageUrl}
                    alt={ban.title}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-150 shrink-0 bg-slate-50"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-mono">
                        Posição: {ban.position}
                      </span>
                      {ban.active ? (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider font-mono">
                          Ativo (Visível)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider font-mono">
                          Inativo
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1">{ban.title}</h4>
                    <a 
                      href={ban.targetUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 font-bold truncate inline-block max-w-[240px] hover:underline"
                    >
                      {ban.targetUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleBanner(ban.id)}
                    className="p-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-700 flex items-center gap-1 text-xs font-bold font-mono"
                  >
                    {ban.active ? <ToggleRight className="h-5 w-5 text-indigo-600" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                    <span>Alternar</span>
                  </button>

                  <button
                    onClick={() => onDeleteBanner(ban.id)}
                    className="p-2 border border-red-250 bg-red-50 text-red-650 hover:bg-red-105 rounded-lg transition"
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
