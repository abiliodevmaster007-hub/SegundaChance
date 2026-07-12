import React from 'react';

interface FooterProps {
  onTermsClick: () => void;
}

export default function Footer({ onTermsClick }: FooterProps) {
  return (
    <footer className="h-12 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
      <div className="flex items-center gap-2">
        <span>© 2026 SegundaChance Angola</span>
        <span className="text-slate-200">•</span>
        <button 
          id="footer-terms-btn" 
          type="button"
          onClick={onTermsClick} 
          className="hover:text-indigo-650 transition cursor-pointer font-extrabold uppercase"
        >
          Termos & Privacidade
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-slate-500 font-bold">ONLINE</span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
        <span className="hidden sm:block text-slate-550 border-r-0">IDIOMA: <b>PORTUGUÊS (AO)</b></span>
      </div>
    </footer>
  );
}
