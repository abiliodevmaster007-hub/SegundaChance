export interface AdPlan {
  name: string;
  price: number;
  period: string;
  desc: string;
  features: string[];
}

export const AD_PLANS: Record<'bronze' | 'prata' | 'ouro', AdPlan> = {
  bronze: {
    name: 'Plano Semanal Bronze',
    price: 5000,
    period: '7 Dias',
    desc: 'Mais indicado para promoções pontuais e eventos rápidos.',
    features: ['Presença na coluna lateral', 'Rotação inteligente de 10 segs', 'Painel de cliques estáticos']
  },
  prata: {
    name: 'Plano Mensal Prata',
    price: 15000,
    period: '30 Dias',
    desc: 'O mais popular! Perfeito para pequenas lojas e prestadores de serviços de proximidade.',
    features: ['Presença na coluna lateral', 'Rotação inteligente de 10 segs', 'Apoio básico ao cliente', 'Métricas na dashboard']
  },
  ouro: {
    name: 'Plano Premium Ouro',
    price: 35000,
    period: '60 Dias',
    desc: 'Máxima visibilidade! Ideal para marcas consolidadas e imobiliárias.',
    features: ['Presença na coluna lateral', 'Adicionado também no banner de topo', 'Suporte VIP dedicado', 'Destaque visual a cores']
  }
};
