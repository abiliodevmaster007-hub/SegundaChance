import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Listing, AdBanner, ANGOLA_PROVINCES } from '../types';
import {
  MapPin,
  Calendar,
  Star,
  ShoppingBag,
  Edit3,
  Save,
  X,
  Megaphone,
  ArrowLeft,
} from 'lucide-react';
import ListingCard from './ListingCard';
import AdPromotionPayment from './AdPromotionPayment';

interface UserProfileProps {
  currentUser: User;
  onUpdateProfile: (updatedFields: Partial<User>) => void;
  listings: Listing[];
  onOpenListingDetail: (listing: Listing) => void;
  onAddPendingBanner?: (banner: Omit<AdBanner, 'id' | 'createdAt'>) => void;
}

export default function UserProfile({
  currentUser,
  onUpdateProfile,
  listings,
  onOpenListingDetail,
  onAddPendingBanner,
}: UserProfileProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'profile' | 'promote'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    bio:
      currentUser.bio ||
      'Sem biografia ainda. Adicione detalhes sobre as suas preferências de desapego e locais para trocas.',
    location: currentUser.location || 'Luanda',
    avatarUrl:
      currentUser.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: currentUser.phone || '',
  });

  useEffect(() => {
    setFormData({
      name: currentUser.name || '',
      bio:
        currentUser.bio ||
        'Sem biografia ainda. Adicione detalhes sobre as suas preferências de desapego e locais para trocas.',
      location: currentUser.location || 'Luanda',
      avatarUrl:
        currentUser.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: currentUser.phone || '',
    });
  }, [currentUser]);

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const myActiveListings = listings.filter(
    (l) => l.sellerId === currentUser.id && l.status === 'disponivel'
  );

  const handleAddPendingBannerCallback = (banner: Omit<AdBanner, 'id' | 'createdAt'>) => {
    if (onAddPendingBanner) {
      onAddPendingBanner(banner);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Botão de navegação local caso esteja na vista de promoção */}
      {viewMode === 'promote' && (
        <button
          onClick={() => setViewMode('profile')}
          className="mb-6 inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2 px-4 rounded-xl transition border border-slate-200/80 dark:border-slate-700 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao meu Perfil</span>
        </button>
      )}

      {/* RENDERIZAÇÃO CONDICIONAL DA VISTA DE PROMOÇÃO / PAGAMENTO */}
      {viewMode === 'promote' ? (
        <div>
          <AdPromotionPayment onAddPendingBanner={handleAddPendingBannerCallback} />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
            {/* Banner Gradient Decorativo */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-900 relative">
              <button
                onClick={() => setViewMode('promote')}
                className="absolute top-4 right-4 bg-white/95 hover:bg-indigo-600 hover:text-white text-slate-900 font-black text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-md border border-white/20 cursor-pointer group"
              >
                <Megaphone className="h-3.5 w-3.5 text-indigo-600 group-hover:text-white" />
                <span>Anunciar Negócio (Rotação Side Panel)</span>
              </button>
            </div>

            {/* Informações Principais do Perfil */}
            <div className="px-6 pb-6 relative flex flex-col md:flex-row md:items-end gap-5 -translate-y-10 md:-translate-y-6">
              <div className="relative group shrink-0">
                <img
                  src={formData.avatarUrl}
                  alt={currentUser.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 bg-white dark:bg-slate-800 shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0 pt-2 md:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
                      {currentUser.name}
                      {currentUser.role === 'ADMIN' && (
                        <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Gestor / Admin
                        </span>
                      )}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        {currentUser.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Registo:{' '}
                        {new Date(currentUser.createdAt || '2026-01-01').toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar Perfil
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                  {currentUser.bio || 'Este utilizador ainda não preencheu a sua apresentação.'}
                </p>
              </div>
            </div>

            {/* Estatísticas de Feedback */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="p-4 text-center border-r border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Avaliação Média
                </span>
                <span className="inline-flex items-center gap-1 mt-1 text-lg font-black text-indigo-700 dark:text-indigo-400 font-display font-mono tabular-nums">
                  <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                  {currentUser.rating || '4.9'}
                </span>
              </div>

              <div className="p-4 text-center border-r border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Vendas Concluídas
                </span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-lg font-black text-slate-800 dark:text-white font-display font-mono tabular-nums">
                  <ShoppingBag className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  {currentUser.totalSales ?? 15}
                </span>
              </div>

              <div className="p-4 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Anúncios Online
                </span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-lg font-black text-slate-800 dark:text-white font-display font-mono tabular-nums">
                  {myActiveListings.length} artigos
                </span>
              </div>
            </div>
          </div>

          {/* Formulário de Edição de Perfil */}
          {isEditing && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 mb-8 relative">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display text-base font-extrabold text-slate-800 dark:text-white">
                  Modificar Dados do Perfil
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Província em Angola
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {ANGOLA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Biografia / Apresentação
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    placeholder="Introduza uma breve biografia..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    URL da Fotografia de Perfil
                  </label>
                  <input
                    type="text"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Gravar Perfil</span>
                </button>
              </div>
            </div>
          )}

          {/* Secção / Banner Incentivo extra para Promover Negócio */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-md">
            <div>
              <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase block">
                Monetização de audiência
              </span>
              <h4 className="font-display font-extrabold text-sm text-white mt-1">
                Quer dar asas à sua empresa em Luanda e Benguela?
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Configure pequenos banners de publicidade rotativa e receba cliques de todos os utilizadores ativos da nossa rede de desapegos.
              </p>
            </div>
            <button
              onClick={() => setViewMode('promote')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl transition shadow-lg shrink-0 cursor-pointer"
            >
              Iniciar Campanha
            </button>
          </div>

          {/* Secção de Termos e Privacidade de Dados */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-[8px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase block">
                  Uso e Segurança de Dados
                </span>
                <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                  Políticas de Privacidade & Termos Legais
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Para garantir a segurança, prevenir esquemas e ajudar no contínuo desenvolvimento da nossa app de desapegos em Angola,{' '}
                  <strong>
                    o SegundaChance reserva o direito de poder usar os dados dos clientes para melhorar ou ajudar a plataforma
                  </strong>
                  .
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/terms')}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wide rounded-xl transition shrink-0 cursor-pointer"
            >
              Consultar Termos
            </button>
          </div>

          {/* Meus Anúncios Ativos */}
          <div className="mt-10">
            <h2 className="font-display text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">
              Os meus Artigos Ativos à Venda
            </h2>

            {myActiveListings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
                <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                  Nenhum anúncio ativo publicado!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Ganhe uns Kwanzas extra com as coisas que já não usa! É totalmente gratuito publicar na SegundaChance.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {myActiveListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onOpenDetail={onOpenListingDetail}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
