import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  HelpCircle, 
  Coins, 
  CheckCircle, 
  Info, 
  Lock, 
  FileText, 
  Globe, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function TermsTab() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('dados');

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <div id="terms-section-container" className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
      
      {/* Editorial Header */}
      <div id="terms-header" className="mb-8 border-b border-slate-200 pb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
          Uso Legal e Transparência
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 mt-3 leading-tight uppercase tracking-tight">
          Termos de Serviço & Política de Privacidade
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-semibold leading-relaxed">
          SegundaChance Angola — Conheça as políticas de funcionamento, segurança e o nosso modelo de monetização transparente.
        </p>
      </div>

      <div id="terms-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: How to make money details (answers the user's first question) */}
        <div id="monetization-showcase" className="lg:col-span-1 space-y-6">
          <div id="monetization-card" className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-950/40 shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 mb-4 border border-indigo-500/30">
              <Coins className="h-5.5 w-5.5" />
            </div>
            
            <h3 className="font-display font-black text-base uppercase tracking-wider text-indigo-300">
              Monetização Ativa
            </h3>
            <p className="text-xs font-bold text-indigo-200 mt-1">
              Como o SegundaChance gera receita sem cobrar taxas sobre as trocas?
            </p>
            
            <p className="text-xs text-slate-300 mt-3.5 leading-relaxed font-sans font-medium">
              Ao contrário de outras plataformas, <strong>não cobramos nenhuma comissão</strong> nas vendas nem taxas adicionais entre compradores e vendedores.
            </p>

            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-750">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-slate-250 leading-relaxed font-semibold">
                  <strong>Espaço Publicitário Rotativo</strong>: Empresas de Angola promovem serviços específicos (ex: Internet, Imobiliárias) pagando pacotes Bronze, Prata e Ouro.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-750">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-slate-250 leading-relaxed font-semibold">
                  <strong>Parcerias Locais</strong>: Geração de leads altamente qualificados para transportadoras físicas que ajudam na entrega do desapego.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-750">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-slate-250 leading-relaxed font-semibold">
                  <strong>Planos de Destaque</strong>: Pequenos negócios ou oficinas promovem as suas marcas através de publicações automáticas no banner lateral ou topo do ecrã.
                </p>
              </div>
            </div>

            <p className="text-[9.5px] text-slate-400 mt-4 leading-relaxed font-sans">
              *Um ecossistema orgânico que protege a poupança do utilizador enquanto impulsiona marcas corporativas de Angola.
            </p>
          </div>

          <div id="safety-disclaimer-card" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-650 mb-3">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-widest font-mono">Trocas Seguras</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Lembre-se sempre de agendar encontros em locais bem movimentados, preferencialmente shoppings ou bombas de combustível em Luanda, Talatona, Kilamba, etc. Nunca faça transferências adiantadas.
            </p>
          </div>
        </div>

        {/* Right: Terms Accordion & Privacy Detailed Sections */}
        <div id="terms-content" className="lg:col-span-2 space-y-4">
          
          <div id="intro-card" className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3.5 items-start">
            <Info className="h-5.5 w-5.5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Ao utilizar a nossa app SegundaChance, concorda com a recolha, tratamento e uso inteligente dos seus dados para melhorarmos a sua experiência de navegação e garantir transparência operacional.
            </p>
          </div>

          {/* Accordion Blocks */}
          <div id="policies-accordion" className="space-y-3">
            
            {/* Clause 1: Data Usage Reservation (CRITICAL MANDATE) */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm">
              <button
                id="accordion-trigger-dados"
                onClick={() => toggleAccordion('dados')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      1. Uso e Tratamento de Dados de Clientes
                    </h3>
                    <span className="text-[9.5px] font-bold text-red-650 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                      Reserva de Direitos Críticos
                    </span>
                  </div>
                </div>
                <ChevronRight className={`h-4.5 w-4.5 text-slate-400 transition-transform ${activeAccordion === 'dados' ? 'rotate-90 text-indigo-600' : ''}`} />
              </button>

              {activeAccordion === 'dados' && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-650 space-y-3 leading-relaxed font-medium">
                  <p>
                    Para garantir que a plataforma funciona de forma ideal, intuitiva e livre de perfis nocivos ou abusivos, <strong>o SegundaChance reserva o direito expresso de recolher, armazenar e tratar dados dos seus utilizadores, anúncios, pesquisas e transações</strong>.
                  </p>
                  
                  <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
                    <h4 className="text-[10.5px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Com que fins são usados estes dados?</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] font-medium font-sans">
                      <li>
                        <strong>Melhoria Técnica e Funcional</strong>: Para diagnosticar problemas nas mensagens em tempo real e otimizar as comunicações de chat.
                      </li>
                      <li>
                        <strong>Algoritmos de Recomendação</strong>: Treinar inteligência interna para sugerir desapegos baseando-se nas pesquisas e província do utilizador.
                      </li>
                      <li>
                        <strong>Personalização de Publicidade</strong>: Exibir anúncios rotativos de negócios (Banners) que sejam úteis e relevantes ao perfil localizado do utilizador.
                      </li>
                      <li>
                        <strong>Prevenção de Fraudes e Ataques</strong>: Avaliar logs de conversação denunciadas para bloquear fakes e proteger a comunidade de esquemas em Angola.
                      </li>
                    </ul>
                  </div>

                  <p>
                    Os utilizadores declaram ter pleno conhecimento e outorgar livre consentimento para o tratamento e partilha desses dados, salvaguardando a privacidade essencial através de processos internos de encriptação de ponta e chaves privadas.
                  </p>
                </div>
              )}
            </div>

            {/* Clause 2: Responsabilidade e Moderação */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm">
              <button
                id="accordion-trigger-responsabilidade"
                onClick={() => toggleAccordion('responsabilidade')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">2. Política de Responsabilidade</h3>
                    <span className="text-[9.5px] font-bold text-slate-400 font-mono">Moderação de desapegos</span>
                  </div>
                </div>
                <ChevronRight className={`h-4.5 w-4.5 text-slate-400 transition-transform ${activeAccordion === 'responsabilidade' ? 'rotate-90 text-indigo-600' : ''}`} />
              </button>

              {activeAccordion === 'responsabilidade' && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-650 space-y-2 leading-relaxed font-medium">
                  <p>
                    O SegundaChance Angola é puramente um intermediador de anúncios. Toda a transação monetária, definição de preços e agendamento de ponto de encontro físico é de inteira e exclusiva responsabilidade do vendedor e do comprador.
                  </p>
                  <p>
                    Reservamos o direito de <strong>editar, suspender ou eliminar permanentemente do banco de dados qualquer anúncio</strong> que viole a decência pública, faça publicidade de artigos ilícitos ou represente perigo para a integridade dos cidadãos angolanos.
                  </p>
                </div>
              )}
            </div>

            {/* Clause 3: Políticas de Cookies e Segurança */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm">
              <button
                id="accordion-trigger-cookies"
                onClick={() => toggleAccordion('cookies')}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">3. Segurança, Cookies e Tokens</h3>
                    <span className="text-[9.5px] font-bold text-slate-400 font-mono">Chaves Locais Encriptadas</span>
                  </div>
                </div>
                <ChevronRight className={`h-4.5 w-4.5 text-slate-400 transition-transform ${activeAccordion === 'cookies' ? 'rotate-90 text-indigo-600' : ''}`} />
              </button>

              {activeAccordion === 'cookies' && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-650 space-y-2 leading-relaxed font-medium">
                  <p>
                    Utilizamos <code className="bg-white px-1 py-0.5 rounded border text-indigo-700 font-mono">localStorage</code> para gerir tokens de login (<em className="text-slate-800">sc_token</em>) e sessões de utilizador (<em className="text-slate-800">sc_user</em>) de forma rápida e segura.
                  </p>
                  <p>
                    Estes arquivos de armazenamento local ajudam e lembram as suas preferências de filtragem de províncias (ex: Luanda, Benguela, Huíla), impedindo que tenha de fazer login a cada nova visita. Estes dados não são comercializados a terceiros externos sem a devida autorização explícita.
                  </p>
                </div>
              )}
            </div>

          </div>

          <div id="terms-footer-seal" className="pt-6 border-t border-slate-205 flex items-center gap-3 text-slate-400 font-mono text-[10.5px]">
            <Globe className="h-4.5 w-4.5 text-slate-450" />
            <span>Versão Regulamentar 2026.01 — Registado em Angola.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
