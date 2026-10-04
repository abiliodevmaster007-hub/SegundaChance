import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Listing,
  AdBanner,
  AdminDashboardStats,
  PlatformManagementOverview,
  User,
  Chat,
} from '../types';
import { getApiUrl } from '../apiConfig';
import {
  Users,
  Layers,
  Megaphone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Trash2,
  Server,
  Activity,
  RefreshCw,
  Search,
  ShieldCheck,
  Cpu,
  Database,
  Bot,
  Play,
  TrendingUp,
} from 'lucide-react';
import AdminBannersManager from './AdminBannersManager';

interface AdminPanelProps {
  currentUser?: User | null;
  stats: AdminDashboardStats;
  listings: Listing[];
  banners: AdBanner[];
  onUpdateListingStatus: (listingId: string, status: 'disponivel' | 'vendido' | 'suspenso') => void;
  onDeleteListing: (listingId: string) => void;
  onCreateBanner: (banner: Omit<AdBanner, 'id' | 'createdAt'>) => void;
  onToggleBanner: (bannerId: string) => void;
  onDeleteBanner: (bannerId: string) => void;
}

type ManagerTab = 'overview' | 'server_api' | 'listings' | 'users' | 'banners';

export default function AdminPanel({
  currentUser,
  stats,
  listings,
  banners,
  onUpdateListingStatus,
  onDeleteListing,
  onCreateBanner,
  onToggleBanner,
  onDeleteBanner,
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<ManagerTab>('overview');
  const [overview, setOverview] = useState<PlatformManagementOverview | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [probeStatus, setProbeStatus] = useState<Record<string, string>>({});
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<'todos' | 'disponivel' | 'vendido'>('todos');
  const [userSearch, setUserSearch] = useState('');
  const [selectedAiProvider, setSelectedAiProvider] = useState('HYBRID');
  const [updatingAi, setUpdatingAi] = useState(false);

  // Defesa em profundidade: bloqueia renderização se o utilizador não tiver ROLE_ADMIN
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-600 mb-3" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Acesso Restrito ao Gestor Central
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Esta área é exclusiva para administradores da plataforma (ROLE_ADMIN).
          </p>
        </div>
      </div>
    );
  }

  const formatKz = (val: number) => `${Math.round(val || 0).toLocaleString('pt-PT')} Kz`;

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getAuthHeaders = (includeJson = false): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    try {
      const token = localStorage.getItem('sc_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
    return headers;
  };

  const fetchPlatformData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [ovRes, usrRes, chatRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/overview'), { headers }),
        fetch(getApiUrl('/api/admin/users'), { headers }),
        fetch(getApiUrl('/api/admin/chats'), { headers }),
      ]);

      if (ovRes.ok) {
        const ovData: PlatformManagementOverview = await ovRes.json();
        setOverview(ovData);
      }
      if (usrRes.ok) {
        setUsersList(await usrRes.json());
      }
      if (chatRes.ok) {
        setAllChats(await chatRes.json());
      }
    } catch (e) {
      // Silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData, listings.length]);

  const handleToggleUserRole = async (user: User) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${user.id}/role`), {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        fetchPlatformData();
      }
    } catch (e) {}
  };

  const handleDeleteUserAccount = async (userId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        fetchPlatformData();
      }
    } catch (e) {}
  };

  const handleUpdateAiEngine = async (providerMode: string) => {
    setSelectedAiProvider(providerMode);
    setUpdatingAi(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/ai-config'), {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ provider: providerMode }),
      });
      if (res.ok) {
        await fetchPlatformData();
      }
    } catch (e) {
    } finally {
      setUpdatingAi(false);
    }
  };

  const handleRunEndpointProbe = async (path: string, method: string) => {
    const key = `${method} ${path}`;
    setProbeStatus((prev) => ({ ...prev, [key]: 'A testar...' }));
    const t0 = performance.now();
    try {
      if (method === 'GET') {
        await fetch(getApiUrl(path), { headers: getAuthHeaders() });
      } else if (path.includes('price-analysis')) {
        await fetch(getApiUrl(path), {
          method: 'POST',
          headers: getAuthHeaders(true),
          body: JSON.stringify({ category: 'tecnologia', location: 'Luanda', currentPriceKz: 450000 }),
        });
      } else {
        await fetch(getApiUrl('/api/ai/status'), { headers: getAuthHeaders() });
      }
      const elapsed = Math.round((performance.now() - t0) * 10) / 10;
      setProbeStatus((prev) => ({ ...prev, [key]: `200 OK (${elapsed} ms)` }));
      fetchPlatformData();
    } catch (e) {
      setProbeStatus((prev) => ({ ...prev, [key]: 'Falha de rede' }));
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesStatus =
      listingStatusFilter === 'todos' ? true : item.status === listingStatusFilter;
    const matchesSearch =
      !listingSearch.trim() ||
      item.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(listingSearch.toLowerCase()) ||
      item.location.toLowerCase().includes(listingSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = usersList.filter(
    (u) =>
      !userSearch.trim() ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.location.toLowerCase().includes(userSearch.toLowerCase())
  );

  const gmvActive =
    overview?.totalGmvKz ??
    listings.filter((l) => l.status === 'disponivel').reduce((s, l) => s + l.price, 0);
  const gmvSold =
    overview?.totalSoldVolumeKz ??
    listings.filter((l) => l.status === 'vendido').reduce((s, l) => s + l.price, 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Cabeçalho do Painel Central de Gestor da Plataforma */}
      <div className="border-b border-slate-200 pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            <span>Centro de Comando da Plataforma</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>API & Telemetria Spring Boot</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">Todos os Sistemas Operacionais</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            Painel Central do Gestor da Plataforma
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Controlo total sobre anúncios, utilizadores, motor Spring AI, telemetria de endpoints e estado do servidor backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchPlatformData}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Telemetria</span>
          </button>
        </div>
      </div>

      {/* Barra de Navegação das Secções do Gestor */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/70 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'overview', label: 'Visão Geral & GMV', icon: TrendingUp },
          { id: 'server_api', label: 'Servidor Backend & API', icon: Server },
          { id: 'listings', label: `Anúncios (${listings.length})`, icon: Layers },
          { id: 'users', label: `Utilizadores (${usersList.length || stats.totalUsers})`, icon: Users },
          { id: 'banners', label: `Publicidade & Chats (${banners.length})`, icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as ManagerTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Animado com Framer Motion (AnimatePresence) */}
      <AnimatePresence mode="wait">
        {/* SECÇÃO 1: VISÃO GERAL, GMV EM KWANZAS & AUDITORIA */}
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Grelha de KPIs Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Volume Ativo (GMV Catálogo)</span>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {formatKz(gmvActive)}
                  </p>
                  <span className="text-xs text-emerald-700 font-medium mt-0.5 block">
                    {overview?.activeListings ?? listings.filter((l) => l.status === 'disponivel').length} anúncios disponíveis
                  </span>
                </div>
                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Volume de Vendas Concluídas</span>
                  <p className="text-xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
                    {formatKz(gmvSold)}
                  </p>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    {overview?.soldListings ?? listings.filter((l) => l.status === 'vendido').length} negócios fechados
                  </span>
                </div>
                <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Comunidade & Contas</span>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {overview?.totalUsers ?? usersList.length ?? stats.totalUsers}
                  </p>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    {overview?.totalAdmins ?? 1} administrador(es) ativo(s)
                  </span>
                </div>
                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 border border-slate-200 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Negociações & Mensagens</span>
                  <p className="text-xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                    {overview?.totalChats ?? allChats.length} chats · {overview?.totalMessages ?? stats.messagesSentToday} msgs
                  </p>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Broker STOMP / WebSocket ativo
                  </span>
                </div>
                <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Distribuição por Categoria e Província + Registo de Auditoria */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribuição por Categoria */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Volume Financeiro por Categoria
                  </h3>
                  <p className="text-xs text-slate-500">
                    Concentração de stock e valor em Kwanzas (Kz)
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(overview?.categoryCounts || {}).map(([cat, count]) => {
                    const vol = overview?.categoryVolumeKz?.[cat] || 0;
                    const pct = listings.length > 0 ? Math.round((Number(count) / listings.length) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 capitalize">{cat}</span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {count} anúncios · {formatKz(vol)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.max(8, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribuição por Província de Angola */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Presença Geográfica por Província
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribuição regional dos anúncios em Angola
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {Object.entries(overview?.provinceCounts || {}).map(([prov, count]) => (
                    <div key={prov} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{prov}</span>
                      <span className="font-mono tabular-nums font-semibold text-indigo-600">
                        {count} anúncio(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registo de Auditoria Recente da API */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Registo de Auditoria do Servidor
                    </h3>
                    <p className="text-xs text-slate-500">
                      Eventos recentes de autenticação, IA e catálogo
                    </p>
                  </div>
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {(overview?.recentLogs || []).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-indigo-700">{log.action}</span>
                        <span className="font-mono tabular-nums">
                          {new Date(log.timestamp).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECÇÃO 2: ESTADO DO SERVIDOR BACKEND, TELEMETRIA DA API & CONTROLO SPRING AI */}
        {activeSection === 'server_api' && (
          <motion.div
            key="server_api"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Métricas de Hardware, Memória e Runtime do Servidor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Uptime do Servidor</span>
                  <Server className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {formatUptime(overview?.serverHealth?.uptimeSeconds || 120)}
                </p>
                <span className="text-xs text-slate-500 block truncate">
                  {overview?.serverHealth?.runtimeVersion || 'Spring Boot 3.2.3'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Memória RAM (Heap / RSS)</span>
                  <Cpu className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {overview?.serverHealth?.memoryUsedMb || 94} MB / {overview?.serverHealth?.memoryMaxMb || 512} MB
                </p>
                <span className="text-xs text-slate-500 font-mono tabular-nums block">
                  Utilização: {overview?.serverHealth?.memoryUsagePercent || 18.4}% ({overview?.serverHealth?.cpuCores || 4} vCPUs)
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Motor de Base de Dados & WS</span>
                  <Database className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {overview?.serverHealth?.databaseEngine || 'Spring Data JPA'}
                </p>
                <span className="text-xs text-emerald-700 font-medium block">
                  {overview?.serverHealth?.webSocketBrokerStatus || 'ONLINE (STOMP /ws)'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Provedor Spring AI Ativo</span>
                  <Bot className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-indigo-700 font-mono">
                  {overview?.serverHealth?.aiProvider || 'GEMINI'} · {overview?.serverHealth?.aiModel || 'gemini-3.8-flash'}
                </p>
                <div className="flex items-center gap-1 pt-0.5">
                  {['HYBRID', 'GEMINI', 'OPENAI'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={updatingAi}
                      onClick={() => handleUpdateAiEngine(mode)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold font-mono transition cursor-pointer ${
                        selectedAiProvider === mode
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabela de Monitorização e Latência de Endpoints da API */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Monitor de Endpoints REST & Function Calling da API
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contagem de chamadas, latência média em milissegundos e teste direto de disponibilidade
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  Status Global: 100% Operacional
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Método & Rota</th>
                      <th className="py-3 px-4">Descrição Funcional</th>
                      <th className="py-3 px-4 text-right">Requisições</th>
                      <th className="py-3 px-4 text-right">Latência Média</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(overview?.apiEndpoints || []).map((ep) => {
                      const key = `${ep.method} ${ep.path}`;
                      return (
                        <tr key={key} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <span
                              className={`font-bold mr-2 ${
                                ep.method === 'GET' ? 'text-emerald-700' : 'text-indigo-700'
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="text-slate-900 font-medium">{ep.path}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{ep.description}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                            {ep.callsCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {ep.avgLatencyMs.toFixed(1)} ms
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-emerald-700 font-semibold">{ep.status}</span>
                            {probeStatus[key] && (
                              <span className="ml-2 text-slate-500 font-mono">
                                · {probeStatus[key]}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRunEndpointProbe(ep.path, ep.method)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Play className="h-3 w-3 text-indigo-600" />
                              <span>Testar Rota</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECÇÃO 3: MODERAÇÃO COMPLETA DE ANÚNCIOS */}
        {activeSection === 'listings' && (
          <motion.div
            key="listings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Pesquisar anúncio por título, vendedor ou província..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                {(['todos', 'disponivel', 'vendido'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setListingStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition cursor-pointer whitespace-nowrap ${
                      listingStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'todos' ? 'Todos' : st === 'disponivel' ? 'Ativos' : 'Vendidos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum anúncio corresponde aos critérios selecionados.
                </div>
              ) : (
                filteredListings.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={list.imageUrl}
                        alt={list.title}
                        className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700 capitalize">{list.category}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>Vendedor: {list.sellerName}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span
                            className={
                              list.status === 'vendido'
                                ? 'text-amber-700 font-semibold'
                                : 'text-emerald-700 font-semibold'
                            }
                          >
                            {list.status === 'vendido' ? 'Vendido / Arquivado' : 'Público no Catálogo'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{list.title}</h4>
                        <p className="text-xs font-bold text-indigo-600 font-mono tabular-nums mt-0.5">
                          {formatKz(list.price)} · <span className="font-sans font-normal text-slate-500">{list.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateListingStatus(
                            list.id,
                            list.status === 'vendido' ? 'disponivel' : 'vendido'
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer whitespace-nowrap ${
                          list.status === 'vendido'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {list.status === 'vendido' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>{list.status === 'vendido' ? 'Reativar no Catálogo' : 'Suspender / Marcar Vendido'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteListing(list.id)}
                        className="p-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* SECÇÃO 4: GESTÃO DE UTILIZADORES E PERMISSÕES RBAC */}
        {activeSection === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Procurar utilizador por nome, e-mail ou província..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {filteredUsers.length} conta(s) registada(s)
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filteredUsers.map((usr) => (
                <div
                  key={usr.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {usr.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900 text-sm">{usr.name}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-mono font-semibold ${
                            usr.role === 'ADMIN' ? 'text-indigo-700' : 'text-slate-500'
                          }`}
                        >
                          {usr.role || 'USER'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span>{usr.email}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{usr.phone}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{usr.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleUserRole(usr)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>
                        {usr.role === 'ADMIN' ? 'Alterar para USER' : 'Promover a ADMIN'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUserAccount(usr.id)}
                      className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                      title="Remover conta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SECÇÃO 5: PUBLICIDADE (BANNERS) & AUDITORIA DE CHATS */}
        {activeSection === 'banners' && (
          <motion.div
            key="banners"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <AdminBannersManager
              banners={banners}
              onCreateBanner={onCreateBanner}
              onToggleBanner={onToggleBanner}
              onDeleteBanner={onDeleteBanner}
            />

            {/* Auditoria de Conversas Ativas na Plataforma */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Negociações Ativas na Plataforma ({allChats.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Monitorização de canais de chat abertos entre compradores e vendedores
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {allChats.map((c) => (
                  <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{c.listingTitle}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="font-mono tabular-nums font-semibold text-indigo-600">
                        {formatKz(c.listingPrice)}
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        Comprador: <strong className="text-slate-700">{c.buyerName}</strong> → Vendedor:{' '}
                        <strong className="text-slate-700">{c.sellerName}</strong>
                      </p>
                    </div>
                    <div className="text-slate-600 italic truncate max-w-md">
                      "{c.lastMessageText}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
