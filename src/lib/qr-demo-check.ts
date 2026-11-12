import { QRConfig } from '@/lib/types';

export interface DemoDataWarning {
  isUsingDemoData: boolean;
  reason: string;
  fieldHint: string;
}

export const DEMO_SHOWCASE_SLUGS = new Set([
  'demo-restaurante',
  'demo-catalogo',
]);

export function getDemoDataWarning(config: QRConfig): DemoDataWarning {
  const slug = (config.dynamicSlug || '').trim().toLowerCase();

  switch (config.type) {
    case 'catalog':
      if (!slug || DEMO_SHOWCASE_SLUGS.has(slug)) {
        return {
          isUsingDemoData: true,
          reason:
            'O endereço ainda aponta para o Catálogo Demonstração (/catalogo/demo-catalogo).',
          fieldHint: 'Endereço Personalizado do Catálogo',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };

    case 'menu':
      if (!slug || DEMO_SHOWCASE_SLUGS.has(slug)) {
        return {
          isUsingDemoData: true,
          reason:
            'O endereço ainda aponta para o Cardápio Demonstração (/cardapio/demo-restaurante).',
          fieldHint: 'Endereço Personalizado do Cardápio',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };

    case 'url': {
      const normalized = (config.url || '')
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '');
      if (!normalized || normalized === 'seurestaurante.com.br') {
        return {
          isUsingDemoData: true,
          reason:
            'O link ainda está com o endereço de exemplo (seurestaurante.com.br).',
          fieldHint: 'URL de Destino',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    case 'whatsapp': {
      const digits = (config.whatsappPhone || '').replace(/\D/g, '');
      if (!digits || digits === '5511999998888') {
        return {
          isUsingDemoData: true,
          reason: 'O número ainda é o telefone de exemplo (5511999998888).',
          fieldHint: 'Número do WhatsApp',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    case 'pix': {
      const key = (config.pixKey || '').trim().toLowerCase();
      if (!key || key === 'financeiro@seurestaurante.com.br') {
        return {
          isUsingDemoData: true,
          reason:
            'A Chave PIX ainda é a chave de exemplo (financeiro@seurestaurante.com.br).',
          fieldHint: 'Sua Chave PIX',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    case 'wifi': {
      const ssid = (config.wifiSSID || '').trim();
      if (!ssid || ssid === 'Restaurante_Clientes') {
        return {
          isUsingDemoData: true,
          reason:
            'O nome da rede Wi-Fi ainda está como exemplo (Restaurante_Clientes).',
          fieldHint: 'Nome da Rede Wi-Fi (SSID)',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    case 'google_reviews': {
      const url = (config.googleReviewUrl || '').trim().toLowerCase();
      if (!url || url.includes('g.page/r/seurestaurante/review')) {
        return {
          isUsingDemoData: true,
          reason:
            'O link de avaliação do Google ainda está como endereço de exemplo.',
          fieldHint: 'Link de Avaliação Google',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    case 'instagram': {
      const handle = (config.instagramHandle || '')
        .replace('@', '')
        .trim()
        .toLowerCase();
      if (!handle || handle === 'seurestaurante') {
        return {
          isUsingDemoData: true,
          reason:
            'O @usuário do Instagram ainda está como exemplo (@seurestaurante).',
          fieldHint: 'Instagram (@usuário)',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    case 'vcard': {
      const email = (config.vcardEmail || '').trim().toLowerCase();
      const name = (config.vcardName || '').trim();
      if (
        !name ||
        (name === 'Dr. Carlos Mendes' && email === 'contato@empresa.com.br')
      ) {
        return {
          isUsingDemoData: true,
          reason:
            'O cartão vCard ainda está com os dados fictícios de exemplo.',
          fieldHint: 'Dados do Cartão de Visita',
        };
      }
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
    }

    default:
      return { isUsingDemoData: false, reason: '', fieldHint: '' };
  }
}

