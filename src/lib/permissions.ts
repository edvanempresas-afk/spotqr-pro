/**
 * Regras de Acesso e Matriz de Permissões: FREE vs PRO
 * Modelo de Negócio: Monetização Híbrida (Ads + Micro-SaaS Mercado Pago)
 */

export interface FeatureRule {
  id: string;
  name: string;
  description: string;
  freeAccess: boolean;
  proAccess: boolean;
  freeLimitText: string;
  proLimitText: string;
}

export const FEATURES_MATRIX: FeatureRule[] = [
  {
    id: 'static_qr',
    name: 'Geração de QR Code Estático Básico',
    description: 'Criação de códigos simples para URL, PIX, Wi-Fi e WhatsApp.',
    freeAccess: true,
    proAccess: true,
    freeLimitText: 'Ilimitado (Sem Logo)',
    proLimitText: 'Ilimitado + Completo',
  },
  {
    id: 'custom_colors',
    name: 'Cores e Molduras Básicas',
    description: 'Ajuste de cores dos pontos e moldura de chamada para ação.',
    freeAccess: true,
    proAccess: true,
    freeLimitText: 'Incluído',
    proLimitText: 'Incluído + Degradê PRO',
  },
  {
    id: 'center_logo',
    name: 'Logomarca ou Imagem no Centro do QR Code',
    description: 'Inserção da logo da sua empresa ou ícone exclusivo no centro do código.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Bloqueado (Apenas PRO)',
    proLimitText: 'Liberado (Upload + Ícones)',
  },
  {
    id: 'dynamic_redirect',
    name: 'QR Code Dinâmico com Link Editável',
    description: 'Alterar a URL de destino a qualquer hora sem reimprimir adesivos.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Bloqueado (Link Fixo)',
    proLimitText: 'Edição Ilimitada (/r/slug)',
  },
  {
    id: 'ad_free',
    name: 'Experiência Livre de Anúncios (Ad-Free)',
    description: 'Navegação sem banners, sem anúncios nos cardápios e sem esperas.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Com anúncios estratégicos',
    proLimitText: '100% Sem Anúncios',
  },
  {
    id: 'instant_download',
    name: 'Download Imediato em Alta Resolução',
    description: 'Baixar arquivos PNG 1200px e Vetor SVG sem contagem regressiva.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Espera de 5s com anúncio',
    proLimitText: 'Download Instantâneo 1-Clique',
  },
  {
    id: 'digital_menu',
    name: 'Cardápio Digital Mobile Interativo',
    description: 'Cardápio para mesas com fotos, categorias e pedidos no WhatsApp.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Demonstração com Ads',
    proLimitText: 'Cardápio Completo & Sem Taxas',
  },
  {
    id: 'scan_analytics',
    name: 'Métricas de Leituras (Scans em Tempo Real)',
    description: 'Contador de quantos clientes escanearam a mesa e datas de pico.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Bloqueado',
    proLimitText: 'Relatório Completo em Tempo Real',
  },
  {
    id: 'table_tent_clean',
    name: 'Display de Mesa A6/A5 sem Marca d\'Água',
    description: 'Arte de alta definição pronta para imprimir para suportes de acrílico.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Com marca SpotQR Grátis',
    proLimitText: 'Arte Limpa White-Label 100%',
  },
  {
    id: 'video_cover',
    name: 'Vídeo Curto Animado no Banner do Topo',
    description: 'Use um vídeo curto em loop automático atrás da vitrine no lugar da foto parada.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Apenas Imagem Estática',
    proLimitText: 'Liberado (Vídeo em Loop)',
  },
  {
    id: 'friendly_slug',
    name: 'Link Amigável Personalizado (/catalogo/sua-loja)',
    description: 'Edite o final do endereço público para um nome limpo e fácil de lembrar enquanto for PRO.',
    freeAccess: false,
    proAccess: true,
    freeLimitText: 'Endereço Aleatório Automático',
    proLimitText: 'Liberado + 3 Sugestões',
  },
];

export function canUseCenterLogo(isPro: boolean): boolean {
  return Boolean(isPro);
}

export function canAccessDynamicRedirect(isPro: boolean): boolean {
  return Boolean(isPro);
}

export function canAccessAnalytics(isPro: boolean): boolean {
  return Boolean(isPro);
}

export function shouldShowAds(isPro: boolean): boolean {
  return !isPro;
}

export function canRemoveBranding(isPro: boolean): boolean {
  return Boolean(isPro);
}
