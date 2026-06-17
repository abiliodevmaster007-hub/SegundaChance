import React from 'react';
import { Listing } from '../types';
import { X, MapPin, Phone, MessageSquare, Calendar, Shield, ArrowRight, CheckCircle } from 'lucide-react';

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
  isCurrentUserSeller
}: ListingDetailProps) {
  if (!isOpen) return null;

  const formatKwanza = (val: number) => {
    return val.toLocaleString('pt-PT') + ' Kz';
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'novo': return 'Novo (Nunca usado)';
      case 'excelente': return 'Excelente (Como novo)';
      case 'bom_estado': return 'Bom Estado (Marcas ligeiras)';
      case 'usado':
      default:
        return 'Usado (Marcas visíveis)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row my-8 max-h-[90vh]">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/20 text-white md:bg-white md:text-slate-500 md:border md:border-slate-200 hover:bg-slate-100 transition shadow"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Product Image */}
        <div className="w-full md:w-1/2 bg-slate-955 relative aspect-video md:aspect-auto min-h-[250px] md:min-h-full">
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
          {/* Category Tag */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono mb-2">
            Categoria: {listing.category}
          </span>

          <h2 className="font-display text-2xl font-black text-slate-900 leading-tight">
            {listing.title}
          </h2>

          {/* Pricing Row */}
          <div className="mt-3 py-1 px-3 bg-slate-50 border border-slate-100 rounded-lg inline-self-start self-start">
            <span className="text-xs text-slate-400 block">Preço</span>
            <span className="text-2xl font-black text-indigo-600 font-display">
              {formatKwanza(listing.price)}
            </span>
          </div>

          {/* Condition & Location Specs */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado do Artigo</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{getConditionLabel(listing.condition)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Localização</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{listing.location}</span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 flex-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição do Artigo</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100 italic">
              {listing.description}
            </p>
          </div>

          {/* Seller / Contact Box */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-display uppercase">
                  {listing.sellerName.charAt(0)}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Vendedor</span>
                  <span className="text-sm font-bold text-slate-800">{listing.sellerName}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono block">Contacto</span>
                <span className="text-xs font-semibold text-slate-700">{listing.sellerPhone}</span>
              </div>
            </div>

            {isCurrentUserSeller ? (
              <div className="text-center p-3.5 bg-yellow-50 rounded-xl text-yellow-800 text-xs font-medium border border-yellow-100">
                Este é o seu próprio anúncio. Pode geri-lo e marcá-lo como vendido no seu Painel de Vendedor.
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => onContactSeller(listing)}
                  disabled={listing.status === 'vendido'}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm hover:bg-indigo-700 transition active:scale-98 disabled:opacity-50 shadow hover:shadow-indigo-600/10"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  <span>Iniciar Conversa com o Vendedor</span>
                </button>

                <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                  <Shield className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Dica: Combine em local público e pague após ver o artigo!</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
