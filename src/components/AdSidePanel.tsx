import React, { useState, useEffect } from 'react';
import { AdBanner } from '../types';
import { Sparkles, Megaphone, ArrowUpRight } from 'lucide-react';

interface AdSidePanelProps {
  ads: AdBanner[];
}

export default function AdSidePanel({ ads }: AdSidePanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtra apenas os anúncios ativos
  const activeAds = ads.filter((ad) => ad.active);

  // Garante que currentIndex nunca excede o limite caso um banner seja desativado
  useEffect(() => {
    if (activeAds.length > 0 && currentIndex >= activeAds.length) {
      setCurrentIndex(0);
    }
  }, [activeAds.length, currentIndex]);

  // Roda de 10 em 10 segundos automaticamente
  useEffect(() => {
    if (activeAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeAds.length]);

  if (activeAds.length === 0) {
    return (
      <aside className="w-[260px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col shrink-0 overflow-y-auto hidden xl:flex transition-colors">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 select-none">
          <Megaphone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>Publicidade</span>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center bg-slate-50 dark:bg-slate-800/50 flex-1 flex flex-col justify-center items-center">
            <Sparkles className="h-8 w-8 text-indigo-400 mb-2" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 font-display">
              Anuncie Aqui!
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Alcance milhares de compradores em Angola. Anuncie o seu negócio na SegundaChance de forma simples.
            </p>
            <a
              href="mailto:anuncios@segundachance.co.ao"
              className="mt-3 inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-lg transition"
            >
              Contactar Equipa
            </a>
          </div>
        </div>
      </aside>
    );
  }

  const safeIndex = currentIndex % activeAds.length;
  const currentAd = activeAds[safeIndex];

  return (
    <aside className="w-[260px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col shrink-0 overflow-y-auto hidden xl:flex transition-colors">
      <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-1.5 select-none">
        <div className="flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Publicidade</span>
        </div>
        <span className="font-mono text-[9px] text-slate-400 tabular-nums">
          {safeIndex + 1} / {activeAds.length}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <a
          href={currentAd.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
        >
          {/* Imagem do Banner */}
          <div className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-800">
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm p-1 rounded-md border border-white/10 shadow-sm text-white flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Texto do Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
              {currentAd.title}
            </h4>
            <span className="text-[9px] font-semibold text-slate-400 mt-1 block uppercase tracking-wider truncate">
              {currentAd.targetUrl.replace(/^https?:\/\/(www\.)?/, '')}
            </span>
          </div>
        </a>

        {/* Banner estático inferior para incentivar novas inserções de anúncio */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-3.5 shadow-sm text-center border border-indigo-800/40">
          <span className="text-[8px] font-bold tracking-widest text-indigo-300 uppercase block mb-1">
            PROMOVA O SEU NEGÓCIO
          </span>
          <p className="text-[10px] text-slate-200">
            Banners com rotação inteligente para todo o país.
          </p>
          <a
            href="mailto:pub@segundachance.co.ao"
            className="mt-2 block bg-white hover:bg-slate-100 text-indigo-950 font-black text-[9px] uppercase tracking-wider py-1.5 rounded-lg transition"
          >
            Quero Anunciar
          </a>
        </div>
      </div>
    </aside>
  );
}
