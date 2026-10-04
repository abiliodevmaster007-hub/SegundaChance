import React from 'react';

interface FooterProps {
  onTermsClick: () => void;
}

export default function Footer({ onTermsClick }: FooterProps) {
  return (
    <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] transition-colors">
      <div className="flex items-center gap-2">
        <span>© 2026 SegundaChance Angola</span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <button
          id="footer-terms-btn"
          type="button"
          onClick={onTermsClick}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-extrabold uppercase"
        >
          Termos & Privacidade
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-slate-500 dark:text-slate-400">
          IDIOMA: <b>PORTUGUÊS (AO)</b>
        </span>
      </div>
    </footer>
  );
}
