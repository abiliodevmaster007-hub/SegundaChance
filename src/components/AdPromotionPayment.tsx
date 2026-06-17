import React, { useState } from 'react';
import { AdBanner } from '../types';
import { AD_PLANS } from './AdPlansData';
import { 
  Megaphone, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Coins, 
  Lock,
  Check
} from 'lucide-react';

interface AdPromotionPaymentProps {
  onAddPendingBanner: (banner: Omit<AdBanner, 'id' | 'createdAt'>) => void;
}

export default function AdPromotionPayment({ onAddPendingBanner }: AdPromotionPaymentProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Preencher & Plano, 2: Efetuar Pagamento
  const [success, setSuccess] = useState(false);
  
  const [bannerForm, setBannerForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    position: 'lateral' as 'lateral' | 'topo',
    active: false,
  });

  const [selectedPlan, setSelectedPlan] = useState<'bronze' | 'prata' | 'ouro'>('prata');
  const [paymentMethod, setPaymentMethod] = useState<'express' | 'iban'>('express');
  const [expressPhone, setExpressPhone] = useState('');
  const [comprovativoSimulated, setComprovativoSimulated] = useState(false);
  const [comprovativoName, setComprovativoName] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const currentPlanDetails = AD_PLANS[selectedPlan];

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.imageUrl || !bannerForm.targetUrl) {
      alert('Por favor, introduza todos os dados solicitados para o seu banner de negócio.');
      return;
    }
    setStep(2);
  };

  const handlePayNow = () => {
    if (paymentMethod === 'express' && !expressPhone) {
      alert('Por favor, indique o número de telemóvel associado ao seu Multicaixa Express.');
      return;
    }
    if (paymentMethod === 'iban' && !comprovativoSimulated) {
      alert('Por favor, simule o upload do comprovativo bancário para confirmação.');
      return;
    }

    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setSuccess(true);
      onAddPendingBanner({
        title: bannerForm.title,
        imageUrl: bannerForm.imageUrl,
        targetUrl: bannerForm.targetUrl,
        position: bannerForm.position,
        active: false
      });
    }, 2500);
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-xl mx-auto shadow-sm animate-fadeIn">
        <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-display font-black text-slate-900 text-xl uppercase tracking-tight">O seu pedido foi recebido!</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          O seu banner foi enviado com sucesso para a fila de moderação no painel do administrador.
        </p>

        <div className="my-5 p-4 bg-slate-55 rounded-xl border border-slate-150 text-left space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Serviço de Negócio</span>
            <span className="text-slate-800 truncate max-w-[200px]">{bannerForm.title}</span>
          </div>
          <div className="flex justify-between text-xs border-t border-slate-150 pt-2 font-semibold">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Plano Selecionado</span>
            <span className="text-indigo-700">{currentPlanDetails.name}</span>
          </div>
          <div className="flex justify-between text-xs border-t border-slate-150 pt-2 font-semibold">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Valor Pago</span>
            <span className="font-mono text-slate-900">{currentPlanDetails.price.toLocaleString('pt-PT')} Kz</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-2 font-medium">
          Assim que o administrador validar os dados do comprovativo bancário ou liquidação do Express, o banner ficará ativo instantaneamente na rotação inteligente de 10 segundos.
        </p>

        <button
          onClick={() => {
            setStep(1);
            setSuccess(false);
            setBannerForm({ title: '', imageUrl: '', targetUrl: '', position: 'lateral', active: false });
            setComprovativoSimulated(false);
          }}
          className="mt-6 inline-flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide px-5 py-2.5 rounded-lg transition cursor-pointer"
        >
          <span>Desenhar Novo Anúncio</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      {/* Welcome Sponsor Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white mb-8 relative overflow-hidden border border-slate-850 shadow-md">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6 scale-150">
          <Megaphone className="h-56 w-56 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-900/50">
            SegundaChance Ads Angola — Rotação Própria
          </span>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-3 leading-snug">
            Promova o Seu Negócio Para Milhares de Compradores
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
            Destaque os seus empreendimentos imobiliários, marcas locais de roupas ou serviços. Os nossos banners são mostrados continuamente em intervalos automáticos de 10 segundos para gerar tráfego direcionado ao seu site ou WhatsApp!
          </p>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-205 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-display font-black text-slate-800 text-base flex items-center gap-2 mb-1.5 uppercase tracking-wide">
                <Sparkles className="h-4.5 w-4.5 text-indigo-650" />
                <span>1. Dados do Anúncio de Negócio</span>
              </h3>
              <p className="text-xs text-slate-400 mb-5 font-semibold">
                Introduza os dados e a imagem de destaque do seu empreendimento para compor o banner rotativo de Angola.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Título Curto e Chamativo</label>
                  <input
                    type="text"
                    placeholder="Ex: Condomínio Jardim — Moradias T3 prontas no Sequele!"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-3 text-xs text-slate-850 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Link de Imagem Quadrada (Proporção 1:1)</label>
                  <input
                    type="text"
                    placeholder="Cole um link de imagem (Unsplash, Pixabay ou alojamento próprio)"
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-3 text-xs text-slate-850 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Link de Destino Completo (Site ou Link de WhatsApp)</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.co.ao ou https://wa.me/2449xxxxxxxx"
                    value={bannerForm.targetUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-3 text-xs text-slate-850 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Formato do Banner</label>
                  <select
                    value={bannerForm.position}
                    onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value as 'lateral' | 'topo' })}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-3 text-xs text-slate-855 font-bold outline-none focus:ring-1 focus:ring-indigo-550"
                  >
                    <option value="lateral">Coluna Lateral Direita (Altamente Rotativa)</option>
                    <option value="topo">Topo do Ecrã de Destaques (Máxima Atenção)</option>
                  </select>
                </div>
              </div>
            </div>

            {bannerForm.title && bannerForm.imageUrl && (
              <div className="mt-6 border border-indigo-100 bg-indigo-50/20 p-4 rounded-xl">
                <span className="text-[8px] font-black text-indigo-650 uppercase tracking-wider block mb-2">Simulação de Pré-visualização</span>
                <div className="flex gap-3 items-center">
                  <img src={bannerForm.imageUrl} className="h-12 w-12 rounded-lg object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" onError={(e)=>{e.currentTarget.src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150"}}/>
                  <div className="min-w-0">
                    <h5 className="text-[11px] font-black text-slate-900 truncate">{bannerForm.title}</h5>
                    <span className="text-[9px] text-indigo-700 font-mono truncate block mt-0.5">{bannerForm.targetUrl}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Plans List */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-slate-800 text-base uppercase tracking-wide">2. Escolha o Plano</h3>
            <div className="space-y-3">
              {(Object.keys(AD_PLANS) as Array<'bronze' | 'prata' | 'ouro'>).map((planKey) => {
                const plan = AD_PLANS[planKey];
                const isSelected = selectedPlan === planKey;
                return (
                  <div
                    key={planKey}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/65 border-indigo-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black text-slate-905 block">{plan.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{plan.period} de visualização</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-900 text-sm block">{plan.price.toLocaleString('pt-PT')}</span>
                        <span className="text-[8px] font-black text-indigo-650 uppercase tracking-widest block">Kwanza (Kz)</span>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-2 leading-normal font-semibold">{plan.desc}</p>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1">
                      {plan.features.slice(0, 2).map((feat, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          <Check className="h-2.5 w-2.5 text-indigo-650" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm mt-4 cursor-pointer"
            >
              <span>Prosseguir para Pagamento</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      ) : (
        /* PAYMENT PROCESS SCREEN */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs max-w-2xl mx-auto">
          <h3 className="font-display font-black text-slate-800 text-base flex items-center gap-2 mb-2 uppercase tracking-wide">
            <CreditCard className="h-5 w-5 text-indigo-650" />
            <span>Processamento de Pagamento em Angola</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6 font-semibold">
            Selecione o seu método favorito para liquidar o plano <strong className="text-indigo-600">{currentPlanDetails.name}</strong> no valor de <strong className="font-mono text-slate-900">{currentPlanDetails.price.toLocaleString('pt-PT')} Kz</strong>.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('express')}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition cursor-pointer select-none ${
                paymentMethod === 'express' ? 'bg-indigo-50/40 border-indigo-600 text-indigo-750 font-black shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
              }`}
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">MCX</div>
              <span className="text-[11px] uppercase tracking-wide font-black block">Multicaixa Express</span>
            </button>

            <button
              onClick={() => setPaymentMethod('iban')}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition cursor-pointer select-none ${
                paymentMethod === 'iban' ? 'bg-indigo-50/40 border-indigo-600 text-indigo-750 font-black shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
              }`}
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-mono font-black text-xs">IBAN</div>
              <span className="text-[11px] uppercase tracking-wide font-black block font-sans">Transferência Bancária</span>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl mb-6">
            {paymentMethod === 'express' ? (
              <div className="space-y-4">
                <span className="text-[9px] font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest block w-fit">Notificação Push MCX</span>
                <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                  Surgirá uma autorização de saque seguro de <strong className="text-slate-850 font-mono">{currentPlanDetails.price.toLocaleString('pt-PT')} Kz</strong> na sua app do telemóvel.
                </p>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nº Telemóvel do Express (Angola)</label>
                  <input
                    type="phone"
                    placeholder="9xxxxxxxx"
                    value={expressPhone}
                    onChange={(e) => setExpressPhone(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg p-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-1 focus:ring-indigo-550"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-[9px] font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest block w-fit">Dados para Transferência</span>
                <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                  Efetue a transferência ou depósito no valor exato de <strong className="text-slate-900 font-mono">{currentPlanDetails.price.toLocaleString('pt-PT')} Kz</strong> para o nosso IBAN corporativo.
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-150 relative font-mono text-[10.5px] text-slate-800 space-y-1 pb-4">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[9px] font-bold text-slate-400">BANCO DESTINATÁRIO</span>
                    <span>BFA (Banco de Fomento Angola)</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1 font-semibold">
                    <span className="text-[9px] font-bold text-slate-400">TITULAR DE CONTA</span>
                    <span>SegundaChance Angola, Lda</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1 items-center font-semibold">
                    <span className="text-[9px] font-bold text-slate-400">IBAN SEGUNDACHANCE</span>
                    <span className="font-black select-all bg-indigo-50 text-indigo-850 px-1.5 py-0.5 rounded cursor-pointer">
                      AO06.0006.0045.3342.1120.1018.9
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anexar Comprovativo Bancário (Simulação)</label>
                  {comprovativoSimulated ? (
                    <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50/70 text-emerald-800 rounded-lg text-xs font-bold">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">{comprovativoName}</span>
                      </div>
                      <button onClick={() => setComprovativoSimulated(false)} className="text-[10px] uppercase text-slate-400 hover:text-slate-600 underline">Substituir</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setComprovativoSimulated(true);
                        setComprovativoName('COMPROVATIVO_TRANSF_' + Math.floor(Math.random() * 900000 + 100000) + '.PDF');
                      }}
                      className="w-full flex flex-col items-center justify-center p-5 border border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer"
                    >
                      <Upload className="h-5 w-5 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">Clique para Simular Carregamento</span>
                      <span className="text-[9px] text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-100 pt-4 mb-6 font-semibold">
            <Lock className="h-3.5 w-3.5" />
            <span>Pagamento Seguro encriptado via EMIS de Angola.</span>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wide rounded-lg transition"
              disabled={isPaying}
            >
              Voltar
            </button>
            <button
              onClick={handlePayNow}
              className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              disabled={isPaying}
            >
              {isPaying ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validando</span>
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  <span>Submeter & Pagar {currentPlanDetails.price.toLocaleString('pt-PT')} Kz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
