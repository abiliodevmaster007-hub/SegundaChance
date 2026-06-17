import React from 'react';
import { Listing, CATEGORIES, ANGOLA_PROVINCES } from '../types';
import { SlidersHorizontal, ShieldCheck, Search, FolderOpen, Loader2 } from 'lucide-react';
import ListingCard from './ListingCard';

interface ProductCatalogProps {
  listings: Listing[];
  listingsLoading: boolean;
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onResetFilters: () => void;
  onOpenListingDetail: (listing: Listing) => void;
}

export default function ProductCatalog({
  listings,
  listingsLoading,
  search,
  setSearch,
  category,
  setCategory,
  location,
  setLocation,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onSearchSubmit,
  onResetFilters,
  onOpenListingDetail
}: ProductCatalogProps) {
  return (
    <div className="flex flex-1 overflow-hidden w-full">
      
      {/* Sidebar Filters - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white p-6 flex-col gap-8 shrink-0 overflow-y-auto">
        <div>
          <h3 className="text-xs font-extrabold text-slate-405 uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Categorias</span>
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          </h3>
          <ul className="space-y-2.5">
            <li>
              <button
                onClick={() => setCategory('todos')}
                className={`w-full text-left text-sm py-1 px-2.5 rounded-md font-semibold transition ${
                  category === 'todos' 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                Todos os Artigos
              </button>
            </li>
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setCategory(cat.id)}
                  className={`w-full text-left text-sm py-1 px-2.5 rounded-md transition font-semibold ${
                    category === cat.id 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Location Select */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Província</h3>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
          >
            <option value="todos">Todas as Províncias</option>
            {ANGOLA_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Intervalo de Preço (Kz)</h3>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min Kz"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-medium font-semibold"
            />
            <input
              type="number"
              placeholder="Max Kz"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-medium font-semibold"
            />
          </div>
        </div>

        {/* Reset filter button */}
        {(category !== 'todos' || location !== 'todos' || minPrice || maxPrice || search) && (
          <button
            onClick={onResetFilters}
            className="w-full py-2 px-3 text-xs font-bold rounded-lg border border-red-200 text-red-600 bg-red-50/55 hover:bg-red-50 transition cursor-pointer text-center font-bold uppercase tracking-wider"
          >
            Limpar Todos os Filtros
          </button>
        )}

        <div className="mt-auto bg-slate-900 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
            <span>Dica de Segurança</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
            Combine sempre em locais públicos e bem movimentados. Nunca transfira dinheiro antes de conferir o estado do desapego pessoalmente.
          </p>
        </div>
      </aside>

      {/* Main Listings Catalog Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col">
        <div className="mb-6">
          <form onSubmit={onSearchSubmit} className="flex gap-2 w-full max-w-xl">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar sapatilhas, telemóveis, carros, sofás..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 rounded-lg py-2.5 font-bold text-sm hover:bg-indigo-700 transition shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Procurar
            </button>
          </form>

          {/* Mobile Simple Filters */}
          <div className="flex lg:hidden flex-wrap items-center gap-2 mt-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="todos">Todas as Categorias</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="todos">Todo o País</option>
              {ANGOLA_PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {(category !== 'todos' || location !== 'todos' || search) && (
              <button
                onClick={onResetFilters}
                className="py-1.5 px-3 bg-red-50 text-red-650 text-xs font-bold rounded-lg border border-red-100 uppercase tracking-wide"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display uppercase tracking-tight">
            {category !== 'todos' 
              ? CATEGORIES.find(c => c.id === category)?.label 
              : 'Destaques em Angola'}
            {location !== 'todos' && ` em ${location}`}
          </h1>
          
          <span className="text-xs text-slate-400 font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
            {listings.length} {listings.length === 1 ? 'artigo disponível' : 'artigos disponíveis'}
          </span>
        </div>

        {/* Dynamic listings grid */}
        {listingsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="mt-3 text-sm text-slate-500 font-bold animate-pulse uppercase tracking-wider">A carregar anúncios seguros...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-slate-200/60 p-8 shadow-inner animate-fadeIn">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
              <FolderOpen className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-black text-slate-800 uppercase tracking-tight">Nenhum desapego encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
              Infelizmente não encontramos nenhum anúncio que corresponda à sua pesquisa ou filtros de momento. Tente alterar os critérios!
            </p>
            <button
              onClick={onResetFilters}
              className="mt-5 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold text-xs rounded-xl transition uppercase tracking-wider cursor-pointer"
            >
              Ver Tudo de Novo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
            {listings.map((item) => (
              <ListingCard 
                key={item.id} 
                listing={item} 
                onOpenDetail={onOpenListingDetail} 
              />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
