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

export const DEFAULT_CARD_FEE_NOTICE =
  'No cartão, há repasse da taxa da maquininha';

export const CARD_FEE_NOTICE_SUGGESTIONS: string[] = [
  'No cartão, há repasse da taxa da maquininha',
  'Cartão com acréscimo da taxa da maquininha',
  'Crédito/Débito com taxa da operadora',
];

/** Returns true if the store accepts credit or debit card payments. */
export function acceptsAnyCardPayment(
  menu?: Pick<RestaurantMenu, 'slug' | 'acceptedPayments'> | null
): boolean {
  const accepted = getAcceptedPaymentsList(menu);
  return accepted.includes('credit_card') || accepted.includes('debit_card');
}

/** Resolves the customer-facing card fee pass-through notice when enabled by the merchant. */
export function resolveCardFeeNotice(
  menu?: Pick<
    RestaurantMenu,
    'slug' | 'acceptedPayments' | 'passCardFeeToBuyer' | 'cardFeeNoticeText'
  > | null
): string | null {
  if (!menu?.passCardFeeToBuyer || !acceptsAnyCardPayment(menu)) {
    return null;
  }
  const custom =
    typeof menu.cardFeeNoticeText === 'string'
      ? menu.cardFeeNoticeText.trim()
      : '';
  return custom || DEFAULT_CARD_FEE_NOTICE;
}

