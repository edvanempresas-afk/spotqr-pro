export type QRType =
  | 'url'
  | 'whatsapp'
  | 'pix'
  | 'wifi'
  | 'menu'
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
  frameText: string;
  frameColor: string;
  frameTextColor: string;

  // Dynamic details
  isDynamic: boolean;
  dynamicSlug?: string;
  title?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  badge?: string; // 'Mais Vendido' | 'Novo' | 'Promoção' | 'Vegetariano' | 'Chef Especial'
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface RestaurantMenu {
  id: string;
  slug: string;
  title: string;
  description: string;
  whatsappNumber: string;
  currency: string;
  tableNumberPrompt: boolean;
  themeColor: string;
  coverImage?: string;
  logoImage?: string;
  categories: MenuCategory[];
  items: MenuItem[];
  address?: string;
  wifiInfo?: string;
  pixKey?: string;
  openingHours?: string;
  isOpen?: boolean;
  deliveryFee?: number;
  ownerId?: string;
  ownerEmail?: string;
  updatedAt: string;
}

export interface DynamicQRRecord {
  id: string;
  slug: string;
  title: string;
  targetUrl: string;
  type: QRType;
  createdAt: string;
  updatedAt: string;
  scansCount: number;
  lastScannedAt?: string;
  isPaid: boolean;
  paymentId?: string;
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
  | 'new_client';

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


