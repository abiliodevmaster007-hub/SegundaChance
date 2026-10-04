import React from 'react';
import { Listing, CATEGORIES } from '../types';
import { MapPin, CheckCircle2 } from 'lucide-react';

interface ListingCardProps {
  key?: string;
  listing: Listing;
  onOpenDetail: (listing: Listing) => void;
}

export default function ListingCard({ listing, onOpenDetail }: ListingCardProps) {
  const formatKwanza = (val: number) => {
    return val.toLocaleString('pt-PT') + ' Kz';
  };

  const getCategoryLabel = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const getConditionDetails = (cond: string) => {
    switch (cond) {
      case 'novo':
        return {
          label: 'Novo',
          style: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/90 dark:text-indigo-300 dark:border-indigo-800',
        };
      case 'excelente':
        return {
          label: 'Como Novo',
          style: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/90 dark:text-teal-300 dark:border-teal-800',
        };
      case 'bom_estado':
        return {
          label: 'Bom Estado',
          style: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-800',
        };
      case 'usado':
      default:
        return {
          label: 'Usado',
          style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700',
        };
    }
  };

  const cond = getConditionDetails(listing.condition);

  return (
    <div
      onClick={() => onOpenDetail(listing)}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer duration-200"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Condition Badge absolute overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md ${cond.style}`}
          >
            {cond.label}
          </span>
        </div>

        {/* Status indicator on image */}
        {listing.status === 'vendido' && (
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px] flex items-center justify-center">
            <span className="inline-flex items-center space-x-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>Vendido</span>
            </span>
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono mb-1">
          {getCategoryLabel(listing.category)}
        </span>

        <h4 className="font-display text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition duration-150">
          {listing.title}
        </h4>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>

        {/* Footer Area: Price, Location & Details */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
              Preço pedido
            </span>
            <span className="font-display text-base font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {formatKwanza(listing.price)}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
              {listing.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
