export type QRType =
  | 'url'
  | 'whatsapp'
  | 'pix'
  | 'wifi'
  | 'menu'
  | 'catalog'
  | 'google_reviews'
  | 'vcard'
  | 'instagram';

export type QRStyle = 'squares' | 'dots' | 'rounded' | 'classy';

export type FrameStyle =
  | 'none'
  | 'bottom_tag'
  | 'polaroid'
  | 'badge'
  | 'luxury_border'
  | 'table_tent';

export interface QRConfig {
  type: QRType;
  // Content values
  url: string;
  whatsappPhone: string;
  whatsappMessage: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixName: string;
  pixCity: string;
  pixAmount?: string;
  wifiSSID: string;
  wifiPassword: string;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  googleReviewUrl: string;
  instagramHandle?: string;
  vcardName?: string;
  vcardPhone?: string;
  vcardEmail?: string;
  vcardOrg?: string;
  vcardRole?: string;

  // Customization
  fgColor: string;
  fgGradientColor?: string;
  useGradient?: boolean;
  bgColor: string;
  cornerColor: string;
  dotStyle: QRStyle;
  logoUrl?: string; // base64 or URL
  logoSize: number; // percentage 10 to 30

  // Frame
  frameStyle: FrameStyle;
  frameTopText?: string;
  frameText: string;
  frameColor: string;
  frameTextColor: string;

  // Dynamic details
  isDynamic: boolean;
  dynamicSlug?: string;
  title?: string;
}

export type ProductStockMode = 'unlimited' | 'limited' | 'unique';

export type ShowcaseThemeMode = 'dark' | 'light';

export type ShowcasePaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'payment_link';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  badge?: string; // 'Mais Vendido' | 'Novo' | 'Promoção' | 'Sob Encomenda' | 'Vegetariano' | 'Chef Especial'
  productionDays?: number;
  isAvailable: boolean;
  stockMode?: ProductStockMode;
  stockQuantity?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface RestaurantMenu {
  id: string;
  slug: string;
  originalSlug?: string;
  mode?: 'menu' | 'catalog';
  title: string;
  description: string;
  whatsappNumber: string;
  currency: string;
  tableNumberPrompt: boolean;
  themeColor: string;
  themeMode?: ShowcaseThemeMode;
  coverImage?: string;
  coverVideo?: string;
  logoImage?: string;
  categories: MenuCategory[];
  items: MenuItem[];
  address?: string;
  wifiInfo?: string;
  pixKey?: string;
  openingHours?: string;
  isOpen?: boolean;
  deliveryFee?: number;
  allowDelivery?: boolean;
  allowPickup?: boolean;
  allowOnSite?: boolean;
  acceptedPayments?: ShowcasePaymentMethod[];
  productImagePosition?: 'left' | 'right';
  ownerId?: string;
  ownerEmail?: string;
  updatedAt: string;
}

export interface AutoRenewAttempt {
  timestamp: string;
  slotLabel: string;
  status: 'approved' | 'failed';
  paymentId?: string;
  reason?: string;
  amount: number;
}

export interface AutoRenewConfig {
  enabled: boolean;
  provider: 'mercadopago_card';
  mpCustomerId?: string;
  mpCardId?: string;
  mpPaymentMethodId?: string;
  cardBrand?: string;
  cardLast4?: string;
  holderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  status: 'active' | 'past_due' | 'canceled' | 'suspended_free';
  nextBillingAt: string;
  graceStartedAt?: string | null;
  graceEndsAt?: string | null;
  retryCount: number;
  executedSlots: string[];
  lastAttemptAt?: string | null;
  lastError?: string | null;
  history?: AutoRenewAttempt[];
}

export interface DynamicQRRecord {
  id: string;
  storeCode?: string;
  slug: string;
  originalSlug?: string;
  customSlug?: string;
  title: string;
  targetUrl: string;
  type: QRType;
  createdAt: string;
  updatedAt: string;
  scansCount: number;
  lastScannedAt?: string;
  isPaid: boolean;
  hadProExpired?: boolean;
  proGrantType?: 'paid' | 'indeterminate' | 'days_30' | 'hours' | 'voucher';
  proExpiresAt?: string | null;
  proGrantedAt?: string;
  proGrantedHours?: number;
  proVoucherCode?: string;
  paymentId?: string;
  autoRenew?: AutoRenewConfig | null;
  qrConfig: Partial<QRConfig>;
  linkedMenuId?: string;
  ownerId?: string;
  ownerEmail?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  businessName: string;
  email: string;
  whatsapp: string;
  passwordHash: string;
  createdAt: string;
  sessionVersion?: number;
  recoveryCodeHash?: string;
  recoveryCodeHint?: string;
  lastPasswordResetAt?: string;
  pixLockedUntil?: string | null;
  isSuspended?: boolean;
  proCreditExpiresAt?: string | null;
  proCreditVoucherCode?: string;
  proCreditDays?: number;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  email: string;
  businessName: string;
  registeredWhatsapp: string;
  providedWhatsapp: string;
  whatsappMatched: boolean;
  providedStoreHint?: string;
  providedPixHint?: string;
  pixHintMatched: boolean;
  status: 'pending_admin' | 'approved_ready' | 'used' | 'rejected' | 'expired';
  tokenHash?: string;
  expiresAt: string;
  createdAt: string;
  approvedAt?: string;
  usedAt?: string;
  attempts: number;
}

export interface ProVoucher {
  id: string;
  code: string;
  days: number;
  recipientHint?: string;
  createdAt: string;
  createdBy?: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedByUserId?: string;
  redeemedByEmail?: string;
  redeemedByName?: string;
  redeemedForSlug?: string;
  redeemedStoreName?: string;
  proExpiresAt?: string;
}

export interface AdminStoreSummary {
  id: string;
  storeCode: string;
  slug: string;
  title: string;
  type: QRType;
  isPaid: boolean;
  proGrantType?: DynamicQRRecord['proGrantType'];
  proExpiresAt?: string | null;
  proGrantedAt?: string;
  proGrantedHours?: number;
  proVoucherCode?: string;
  scansCount: number;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerWhatsapp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PixPaymentResponse {
  paymentId: string;
  status: 'pending' | 'approved' | 'rejected';
  qrCodeBase64?: string;
  qrCodeCopyPaste: string;
  ticketUrl?: string;
  checkoutProUrl?: string;
  subscriptionUrl?: string;
  isLiveProduction?: boolean;
  expiresAt: string;
  amount: number;
}

export type DeveloperServiceType =
  | 'sites_landing_pages'
  | 'ia_atendimento'
  | 'marcacao_consultas'
  | 'salao_barbearia'
  | 'delivery_restaurante'
  | 'sistema_sob_medida';

export type DeveloperLeadStatus =
  | 'novo'
  | 'em_contato'
  | 'proposta_enviada'
  | 'fechado'
  | 'arquivado';

export interface DeveloperLead {
  id: string;
  name: string;
  businessName?: string;
  contact: string;
  serviceType: DeveloperServiceType;
  serviceLabel: string;
  budgetRange?: string;
  urgency?: string;
  description: string;
  status: DeveloperLeadStatus;
  estimatedValue?: number;
  developerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperSettings {
  developerName: string;
  developerWhatsapp: string;
  developerEmail: string;
  agencyHeadline: string;
  availableForProjects: boolean;
  adminUsername?: string;
  adminPassword?: string;
  mpAccessToken?: string;
  mpPublicKey?: string;
  mpPixKey?: string;
  mpSubscriptionUrl?: string;
  proPriceReais?: number;
  ntfyTopic?: string;
}

export type DeveloperNotificationType =
  | 'subscription_paid'
  | 'subscription_pending'
  | 'new_lead'
  | 'new_client'
  | 'voucher_redeemed'
  | 'security_alert';

export interface DeveloperNotification {
  id: string;
  type: DeveloperNotificationType;
  title: string;
  message: string;
  amount?: number;
  clientName?: string;
  contact?: string;
  slug?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  slug: string;
  clientName?: string;
  clientEmail?: string;
  status: string;
  amount: number;
  createdAt: string;
  approvedAt?: string;
}


