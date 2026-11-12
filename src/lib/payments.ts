import { RestaurantMenu, ShowcasePaymentMethod } from './types';

export interface ShowcasePaymentOption {
  id: ShowcasePaymentMethod;
  label: string;
  shortLabel: string;
  icon: string;
  whatsappLabel: string;
}

export const SHOWCASE_PAYMENT_OPTIONS: ShowcasePaymentOption[] = [
  {
    id: 'pix',
    label: 'PIX',
    shortLabel: 'PIX',
    icon: '⚡',
    whatsappLabel: 'PIX',
  },
  {
    id: 'credit_card',
    label: 'Cartão de Crédito',
    shortLabel: 'Crédito',
    icon: '💳',
    whatsappLabel: 'Cartão de Crédito',
  },
  {
    id: 'debit_card',
    label: 'Cartão de Débito',
    shortLabel: 'Débito',
    icon: '💳',
    whatsappLabel: 'Cartão de Débito',
  },
  {
    id: 'cash',
    label: 'Dinheiro',
    shortLabel: 'Dinheiro',
    icon: '💵',
    whatsappLabel: 'Dinheiro',
  },
  {
    id: 'payment_link',
    label: 'Link de Pagamento',
    shortLabel: 'Link Pagto',
    icon: '🔗',
    whatsappLabel: 'Link de Pagamento',
  },
];

export const DEMO_PAYMENTS: ShowcasePaymentMethod[] = [
  'pix',
  'credit_card',
  'debit_card',
  'cash',
];

export function getAcceptedPaymentsList(
  menu?: Pick<RestaurantMenu, 'slug' | 'acceptedPayments'> | null
): ShowcasePaymentMethod[] {
  if (Array.isArray(menu?.acceptedPayments)) {
    return menu.acceptedPayments;
  }
  if (menu?.slug === 'demo-restaurante' || menu?.slug === 'demo-catalogo') {
    return DEMO_PAYMENTS;
  }
  return [];
}

export function getAcceptedPaymentOptions(
  menu?: Pick<RestaurantMenu, 'slug' | 'acceptedPayments'> | null
): ShowcasePaymentOption[] {
  const ids = getAcceptedPaymentsList(menu);
  return SHOWCASE_PAYMENT_OPTIONS.filter((opt) => ids.includes(opt.id));
}

