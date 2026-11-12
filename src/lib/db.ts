import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DynamicQRRecord,
  RestaurantMenu,
  DeveloperLead,
  DeveloperSettings,
  ClientUser,
  DeveloperNotification,
  DeveloperNotificationType,
  PaymentRecord,
  ProVoucher,
  AdminStoreSummary,
  PasswordResetRequest,
  MenuItem,
  StoreOrder,
  StoreOrderItem,
  StoreOrderStatus,
} from './types';
import { getItemStockInfo } from './stock';
import { DEMO_PAYMENTS } from './payments';
import { computeStableStoreCode, isProStillValid } from './pro-status';
import { isValidFriendlySlugFormat, normalizeFriendlySlug } from './slugs';
import {
  computeLegacyHmacHash,
  generateFormattedSecurityCode,
  hashPasswordSecure,
  isTimestampActiveFuture,
  normalizePixKeyForCompare,
  phonesMatch,
  verifyPasswordSecure,
  verifySecurityToken,
} from './security';

interface DatabaseSchema {
  dynamicQRs: Record<string, DynamicQRRecord>;
  menus: Record<string, RestaurantMenu>;
  payments: Record<string, PaymentRecord>;
  slugRedirects?: Record<string, string>;
  developerLeads?: Record<string, DeveloperLead>;
  developerSettings?: DeveloperSettings;
  developerNotifications?: Record<string, DeveloperNotification>;
  users?: Record<string, ClientUser>;
  vouchers?: Record<string, ProVoucher>;
  passwordResets?: Record<string, PasswordResetRequest>;
  orders?: Record<string, StoreOrder>;
}

export function hashClientPassword(password: string): string {
  return computeLegacyHmacHash(password);
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const TMP_DB_FILE = path.join('/tmp', 'spotqr-database.json');

declare global {
  // eslint-disable-next-line no-var
  var __spotqrDbMemory: DatabaseSchema | undefined;
}

export function createStarterMenu(
  slug: string,
  title: string = 'Meu Restaurante & Grill',
  whatsappNumber: string = '5511999998888',
  pixKey: string = 'pix@seurestaurante.com.br'
): RestaurantMenu {
  return {
    id: slug,
    slug,
    mode: 'menu',
    title,
    description:
      'Hambúrgueres artesanais grelhados no fogo, porções crocantes, bebidas geladas e sobremesas exclusivas.',
    whatsappNumber,
    currency: 'R$',
    tableNumberPrompt: true,
    themeColor: '#16a34a',
    themeMode: 'dark',
    address: 'Rua Gastronômica, 142 - Jardins, São Paulo',
    wifiInfo: 'Cliente_VIP | Senha: bemvindo2026',
    pixKey,
    openingHours: 'Ter a Dom • 11h30 às 23h30',
    isOpen: true,
    deliveryFee: 6.0,
    allowDelivery: true,
    allowPickup: true,
    allowOnSite: true,
    acceptedPayments: slug === 'demo-restaurante' ? DEMO_PAYMENTS : [],
    productImagePosition: 'right',
    updatedAt: new Date().toISOString(),
    categories: [
      { id: 'cat-1', name: '🍔 Burgers Especiais' },
      { id: 'cat-2', name: '🍟 Porções & Entradas' },
      { id: 'cat-3', name: '🥤 Bebidas & Drinks' },
      { id: 'cat-4', name: '🍰 Sobremesas' },
    ],
    items: [
      {
        id: 'item-1',
        name: 'Smash Bacon Supremo',
        description:
          'Duplo blend 100g de costela angus, queijo cheddar inglês derretido, tiras de bacon crocante e maionese defumada no pão brioche selado na manteiga.',
        price: 36.9,
        category: 'cat-1',
        imageUrl:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        badge: 'Mais Vendido',
        isAvailable: true,
      },
      {
        id: 'item-2',
        name: 'Truffle Gorgonzola Melt',
        description:
          'Blend 180g angus, fonduta cremosa de queijo gorgonzola, cebola caramelizada no melado e toque de azeite trufado.',
        price: 42.0,
        category: 'cat-1',
        imageUrl:
          'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
        badge: 'Chef Especial',
        isAvailable: true,
      },
      {
        id: 'item-3',
        name: 'Crispy Chicken Honey Mustard',
        description:
          'Sobrecoxa de frango empanada ultra crocante, alface americana, picles artesanal e molho honey mustard da casa.',
        price: 34.5,
        category: 'cat-1',
        imageUrl:
          'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&auto=format&fit=crop&q=80',
        badge: 'Novo',
        isAvailable: true,
      },
      {
        id: 'item-4',
        name: 'Batata Rústica com Alecrim & Páprica',
        description:
          'Batatas selecionadas crocantes por fora e macias por dentro, finalizadas com flor de sal, alecrim fresco e maionese de alho assado.',
        price: 24.5,
        category: 'cat-2',
        imageUrl:
          'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
        badge: 'Mais Vendido',
        isAvailable: true,
      },
      {
        id: 'item-5',
        name: 'Dadinhos de Tapioca com Geleia de Pimenta',
        description:
          'Porção com 12 unidades de dadinhos de queijo coalho dourados, acompanhados de geleia artesanal de pimenta biquinho.',
        price: 28.9,
        category: 'cat-2',
        imageUrl:
          'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
      },
      {
        id: 'item-6',
        name: 'Milkshake de Pistache Trufado 400ml',
        description:
          'Sorvete artesanal de pistache italiano batido com calda de chocolate branco e farofa crocante de pistache tostado.',
        price: 24.9,
        category: 'cat-3',
        imageUrl:
          'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
        badge: 'Imperdível',
        isAvailable: true,
      },
      {
        id: 'item-7',
        name: 'Soda Italiana de Frutas Vermelhas',
        description:
          'Água com gás super gelada, xarope artesanal de amora, framboesa e morango com folhas de hortelã fresca.',
        price: 16.0,
        category: 'cat-3',
        imageUrl:
          'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
      },
      {
        id: 'item-8',
        name: 'Petit Gâteau de Doce de Leite com Sorvete',
        description:
          'Bolinho quente de doce de leite argentino com casquinha crocante, servido com bola de sorvete de baunilha de Madagascar.',
        price: 26.9,
        category: 'cat-4',
        imageUrl:
          'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&auto=format&fit=crop&q=80',
        badge: 'Mais Vendido',
        isAvailable: true,
      },
      {
        id: 'item-9',
        name: 'Brownie Belga Meio Amargo com Calda Quente',
        description:
          'Brownie artesanal com nozes pecã, coberto com ganache de chocolate 70% e morangos frescos.',
        price: 22.5,
        category: 'cat-4',
        imageUrl:
          'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
      },
    ],
  };
}

export function createStarterCatalog(
  slug: string,
  title: string = 'Studio Criativo & Loja',
  whatsappNumber: string = '5511999998888',
  pixKey: string = 'pix@minhaloja.com.br'
): RestaurantMenu {
  return {
    id: slug,
    slug,
    mode: 'catalog',
    title,
    description:
      'Catálogo digital de produtos exclusivos: Impressões 3D personalizadas, Moda & Roupas, Artesanato feito à mão e Presentes especiais.',
    whatsappNumber,
    currency: 'R$',
    tableNumberPrompt: false,
    themeColor: '#10b981',
    themeMode: 'dark',
    coverImage: '/catalogo/cover-loja.jpg',
    address: 'São Paulo - SP',
    wifiInfo: '',
    pixKey,
    openingHours: 'Seg a Sáb • 09h às 19h',
    isOpen: true,
    deliveryFee: 0,
    allowDelivery: false,
    allowPickup: false,
    allowOnSite: false,
    acceptedPayments: slug === 'demo-catalogo' ? DEMO_PAYMENTS : [],
    productImagePosition: 'right',
    updatedAt: new Date().toISOString(),
    categories: [
      { id: 'cat-3d', name: '🖨️ Impressões 3D' },
      { id: 'cat-roupas', name: '👕 Roupas & Moda' },
      { id: 'cat-artesanato', name: '🧶 Artesanato & Decor' },
      { id: 'cat-presentes', name: '🕯️ Velas & Presentes' },
    ],
    items: [
      {
        id: 'cat-item-1',
        name: 'Luminária Lua Cheia 3D + Organizador',
        description:
          'Impressão 3D em PLA biodegradável de alta precisão com base em madeira natural e iluminação LED quente. Pode personalizar nome.',
        price: 89.9,
        category: 'cat-3d',
        imageUrl: '/catalogo/prod-3d.jpg',
        badge: 'Mais Vendido',
        isAvailable: true,
      },
      {
        id: 'cat-item-2',
        name: 'Suporte Geométrico 3D de Mesa',
        description:
          'Porta-canetas, celular ou controles impresso em 3D acabamento fosco grafite ou sob encomenda em várias cores.',
        price: 49.9,
        category: 'cat-3d',
        imageUrl: '/catalogo/prod-3d.jpg',
        badge: 'Sob Encomenda',
        isAvailable: true,
      },
      {
        id: 'cat-item-3',
        name: 'Camiseta Oversized Algodão Premium',
        description:
          'Malha pesada 100% algodão fio 30.1 penteado, modelagem streetwear confortável unissex. Tamanhos disponíveis: P, M, G e GG.',
        price: 119.9,
        category: 'cat-roupas',
        imageUrl: '/catalogo/prod-roupa.jpg',
        badge: 'Pronta Entrega',
        isAvailable: true,
      },
      {
        id: 'cat-item-4',
        name: 'Conjunto Vaso Cerâmica & Painel Macramê',
        description:
          'Peças exclusivas feitas 100% à mão em cerâmica terracota e algodão cru natural. Ideal para decorar sala, quarto ou escritório.',
        price: 135.0,
        category: 'cat-artesanato',
        imageUrl: '/catalogo/prod-artesanato.jpg',
        badge: 'Feito à Mão',
        isAvailable: true,
      },
      {
        id: 'cat-item-5',
        name: 'Vela Aromática Lavanda & Caixa Presente',
        description:
          'Cera vegetal ecológica em vidro âmbar com tampa de cortiça + caixa de madeira artesanal. Queima limpa de até 40 horas.',
        price: 68.0,
        category: 'cat-presentes',
        imageUrl: '/catalogo/prod-vela.jpg',
        badge: 'Exclusivo',
        isAvailable: true,
      },
    ],
  };
}

// Initial data: ONLY the public visitor demos (/cardapio/demo-restaurante and /catalogo/demo-catalogo). Zero fictional leads, payments, notifications or users.
const initialData: DatabaseSchema = {
  dynamicQRs: {
    'demo-restaurante': {
      id: 'qr-demo-visitante',
      slug: 'demo-restaurante',
      title: 'Smash & Grill Burger (Cardápio Demonstração Visitantes)',
      targetUrl: '/cardapio/demo-restaurante',
      type: 'menu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: 0,
      isPaid: true,
      linkedMenuId: 'demo-restaurante',
      qrConfig: {
        fgColor: '#0f172a',
        bgColor: '#ffffff',
        cornerColor: '#16a34a',
        dotStyle: 'rounded',
        frameStyle: 'table_tent',
        frameTopText: '📱 CARDÁPIO NA MESA',
        frameText: 'VER CARDÁPIO & PEDIR',
        frameColor: '#16a34a',
        frameTextColor: '#ffffff',
      },
    },
    'demo-catalogo': {
      id: 'qr-demo-catalogo',
      slug: 'demo-catalogo',
      title: 'Studio Criativo & Loja (Catálogo Demonstração Visitantes)',
      targetUrl: '/catalogo/demo-catalogo',
      type: 'catalog',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: 0,
      isPaid: true,
      linkedMenuId: 'demo-catalogo',
      qrConfig: {
        fgColor: '#0f172a',
        bgColor: '#ffffff',
        cornerColor: '#10b981',
        dotStyle: 'rounded',
        frameStyle: 'table_tent',
        frameTopText: '🛍️ CATÁLOGO DIGITAL',
        frameText: 'VER PRODUTOS & PEDIR',
        frameColor: '#10b981',
        frameTextColor: '#ffffff',
      },
    },
  },
  menus: {
    'demo-restaurante': createStarterMenu(
      'demo-restaurante',
      'Smash & Grill Burger',
      '5511999998888',
      'financeiro@smashgrill.com.br'
    ),
    'demo-catalogo': createStarterCatalog(
      'demo-catalogo',
      'Studio Criativo & Loja',
      '5511999998888',
      'pix@studiocriativo.com.br'
    ),
  },
  payments: {},
  developerSettings: {
    developerName: 'Desenvolvedor Full-Stack & Especialista em IA',
    developerWhatsapp: '5511999998888',
    developerEmail: 'edvandonasicmentosilva@gmail.com',
    adminUsername: 'edvandonasicmentosilva@gmail.com',
    adminPassword: 'Edgatinho1982.',
    agencyHeadline:
      'Desenvolvemos Sites, IA de Atendimento 24h, Sistemas de Agendamento para Clínicas, Salões de Beleza, Barbearias e Restaurantes.',
    availableForProjects: true,
    mpPublicKey: 'APP_USR-8b245dbb-b6c0-4335-b46a-ae016ea5071d',
    mpAccessToken:
      'APP_USR-4000171423020297-110821-0d5a69a11b676b64931811de85b054a0-244576316',
    proPriceReais: 10.9,
    ntfyTopic: 'spotqr-edvan-alertas-1982',
  },
  developerLeads: {},
  developerNotifications: {},
  users: {},
  orders: {},
};

function ensureDb(): DatabaseSchema {
  try {
    let raw = '';
    const isVercel = Boolean(process.env.VERCEL);

    if (isVercel && fs.existsSync(TMP_DB_FILE)) {
      raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
    } else if (fs.existsSync(DB_FILE)) {
      raw = fs.readFileSync(DB_FILE, 'utf-8');
    } else if (globalThis.__spotqrDbMemory) {
      return globalThis.__spotqrDbMemory;
    } else {
      saveDb(initialData);
      return initialData;
    }

    const parsed: DatabaseSchema = JSON.parse(raw);

    let modified = false;

    // Ensure demo-restaurante and demo-catalogo always exist cleanly for visitors
    if (
      parsed.menus['demo-restaurante'] &&
      parsed.menus['demo-restaurante'].items.length < 6
    ) {
      parsed.menus['demo-restaurante'] = createStarterMenu(
        'demo-restaurante',
        'Smash & Grill Burger',
        '5511999998888',
        'financeiro@smashgrill.com.br'
      );
      modified = true;
    }

    if (
      !parsed.menus['demo-catalogo'] ||
      parsed.menus['demo-catalogo'].address ===
        'Envio para todo o Brasil • Retirada no Ateliê'
    ) {
      parsed.menus['demo-catalogo'] = createStarterCatalog(
        'demo-catalogo',
        'Studio Criativo & Loja',
        '5511999998888',
        'pix@studiocriativo.com.br'
      );
      modified = true;
    }

    if (!parsed.dynamicQRs['demo-catalogo']) {
      parsed.dynamicQRs['demo-catalogo'] = initialData.dynamicQRs['demo-catalogo'];
      modified = true;
    }

    if (!parsed.developerSettings) {
      parsed.developerSettings = initialData.developerSettings;
      modified = true;
    }

    if (!parsed.developerLeads) {
      parsed.developerLeads = {};
      modified = true;
    } else {
      // Permanently purge any legacy demo leads if cached in /tmp
      for (const demoId of ['lead-demo-1', 'lead-demo-2', 'lead-demo-3']) {
        if (parsed.developerLeads[demoId]) {
          delete parsed.developerLeads[demoId];
          modified = true;
        }
      }
    }

    if (!parsed.developerNotifications) {
      parsed.developerNotifications = {};
      modified = true;
    } else {
      for (const demoNotifId of [
        'notif-demo-1',
        'notif-demo-2',
        'notif-demo-3',
      ]) {
        if (parsed.developerNotifications[demoNotifId]) {
          delete parsed.developerNotifications[demoNotifId];
          modified = true;
        }
      }
    }

    if (!parsed.users) {
      parsed.users = {};
      modified = true;
    }

    if (!parsed.vouchers) {
      parsed.vouchers = {};
      modified = true;
    }

    if (!parsed.slugRedirects) {
      parsed.slugRedirects = {};
      modified = true;
    }

    if (!parsed.passwordResets) {
      parsed.passwordResets = {};
      modified = true;
    }

    if (!parsed.orders) {
      parsed.orders = {};
      modified = true;
    }

    if (modified) {
      saveDb(parsed);
    }

    globalThis.__spotqrDbMemory = parsed;
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return globalThis.__spotqrDbMemory || initialData;
  }
}

function saveDb(data: DatabaseSchema): void {
  globalThis.__spotqrDbMemory = data;
  const serialized = JSON.stringify(data, null, 2);
  try {
    if (process.env.VERCEL) {
      fs.writeFileSync(TMP_DB_FILE, serialized, 'utf-8');
      return;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, serialized, 'utf-8');
  } catch {
    try {
      fs.writeFileSync(TMP_DB_FILE, serialized, 'utf-8');
    } catch {
      // Kept in globalThis.__spotqrDbMemory
    }
  }
}

// PERSISTENCE LAYER: VERCEl KV / UPSTASH REDIS REST SYNC (NO EXTRA NPM PACKAGES NEEDED)
export type CloudSliceKey =
  | 'users'
  | 'qrs'
  | 'payments'
  | 'redirects'
  | 'leads'
  | 'notifications'
  | 'settings'
  | 'vouchers'
  | 'resets'
  | 'orders';

const CLOUD_KEYS: CloudSliceKey[] = [
  'users',
  'qrs',
  'payments',
  'leads',
  'notifications',
  'settings',
  'vouchers',
  'redirects',
  'resets',
  'orders',
];

function getCloudKVConfig(): { url: string; token: string } | null {
  const directUrl = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_API_URL ||
    ''
  ).trim();
  const directToken = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_API_TOKEN ||
    ''
  ).trim();
  if (directUrl && directToken) {
    return { url: directUrl.replace(/\/+$/, ''), token: directToken };
  }

  // Auto-detect custom-prefixed Vercel Storage / Upstash REST variables (e.g., SPOTQR_KV_REST_API_URL)
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^([A-Z0-9_]+?)_(REST_API_URL)$/);
    if (!match) continue;
    const urlVal = (process.env[key] || '').trim();
    const tokenKey = `${match[1]}_REST_API_TOKEN`;
    const tokenVal = (process.env[tokenKey] || '').trim();
    if (urlVal && tokenVal) {
      return { url: urlVal.replace(/\/+$/, ''), token: tokenVal };
    }
  }

  return null;
}

export function isCloudPersistenceConfigured(): boolean {
  return Boolean(getCloudKVConfig());
}

async function kvRequest(command: unknown[]): Promise<any> {
  const cfg = getCloudKVConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[SpotQR Cloud KV] HTTP error:', res.status);
      return null;
    }
    const data = await res.json();
    return data?.result ?? null;
  } catch (err) {
    console.error('[SpotQR Cloud KV] Network error:', err);
    return null;
  }
}

export async function syncDbFromCloud(): Promise<void> {
  if (!getCloudKVConfig()) return;
  const db = ensureDb();
  const results = await kvRequest([
    'MGET',
    ...CLOUD_KEYS.map((k) => `spotqr:${k}`),
  ]);
  if (!Array.isArray(results)) return;

  let changed = false;
  const parseSlice = <T,>(raw: unknown): T | null => {
    if (typeof raw !== 'string' || !raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const cloudUsers = parseSlice<Record<string, ClientUser>>(results[0]);
  if (cloudUsers) {
    db.users = { ...cloudUsers, ...(db.users || {}) };
    // Cloud hash always wins over any partial session stub
    for (const uid of Object.keys(cloudUsers)) {
      if (cloudUsers[uid]?.passwordHash) {
        db.users[uid] = cloudUsers[uid];
      }
    }
    changed = true;
  }

  const cloudQRs = parseSlice<Record<string, DynamicQRRecord>>(results[1]);
  if (cloudQRs) {
    db.dynamicQRs = {
      'demo-restaurante': initialData.dynamicQRs['demo-restaurante'],
      'demo-catalogo': initialData.dynamicQRs['demo-catalogo'],
      ...cloudQRs,
    };
    changed = true;
  }

  const cloudPayments = parseSlice<Record<string, PaymentRecord>>(results[2]);
  if (cloudPayments) {
    db.payments = cloudPayments;
    changed = true;
  }

  const cloudLeads = parseSlice<Record<string, DeveloperLead>>(results[3]);
  if (cloudLeads) {
    db.developerLeads = cloudLeads;
    changed = true;
  }

  const cloudNotifs = parseSlice<Record<string, DeveloperNotification>>(
    results[4]
  );
  if (cloudNotifs) {
    db.developerNotifications = cloudNotifs;
    changed = true;
  }

  const cloudSettings = parseSlice<DeveloperSettings>(results[5]);
  if (cloudSettings) {
    db.developerSettings = {
      ...initialData.developerSettings,
      ...cloudSettings,
    };
    changed = true;
  }

  const cloudVouchers = parseSlice<Record<string, ProVoucher>>(results[6]);
  if (cloudVouchers) {
    db.vouchers = cloudVouchers;
    changed = true;
  }

  const cloudRedirects = parseSlice<Record<string, string>>(results[7]);
  if (cloudRedirects) {
    db.slugRedirects = cloudRedirects;
    changed = true;
  }

  const cloudResets = parseSlice<Record<string, PasswordResetRequest>>(
    results[8]
  );
  if (cloudResets) {
    db.passwordResets = cloudResets;
    changed = true;
  }

  const cloudOrders = parseSlice<Record<string, StoreOrder>>(results[9]);
  if (cloudOrders) {
    db.orders = { ...(db.orders || {}), ...cloudOrders };
    changed = true;
  }

  if (changed) {
    saveDb(db);
  }
}

export async function syncMenuFromCloud(slug: string): Promise<void> {
  if (!slug || !getCloudKVConfig()) return;
  const raw = await kvRequest(['GET', `spotqr:menu:${slug}`]);
  if (typeof raw !== 'string' || !raw) return;
  try {
    const parsedMenu: RestaurantMenu = JSON.parse(raw);
    const db = ensureDb();
    db.menus[slug] = parsedMenu;
    saveDb(db);
  } catch {
    // Ignore malformed cloud menu
  }
}

export async function persistSliceToCloud(slice: CloudSliceKey): Promise<void> {
  if (!getCloudKVConfig()) return;
  const db = ensureDb();

  if (slice === 'users') {
    const rawCloud = await kvRequest(['GET', 'spotqr:users']);
    let cloudUsers: Record<string, ClientUser> = {};
    if (typeof rawCloud === 'string' && rawCloud) {
      try {
        cloudUsers = JSON.parse(rawCloud);
      } catch {
        cloudUsers = {};
      }
    }
    const merged: Record<string, ClientUser> = {
      ...cloudUsers,
      ...(db.users || {}),
    };
    for (const uid of Object.keys(cloudUsers)) {
      if (cloudUsers[uid]?.passwordHash && !merged[uid]?.passwordHash) {
        merged[uid] = cloudUsers[uid];
      }
    }
    db.users = merged;
    saveDb(db);
    await kvRequest(['SET', 'spotqr:users', JSON.stringify(merged)]);
    return;
  }

  if (slice === 'qrs') {
    const rawCloud = await kvRequest(['GET', 'spotqr:qrs']);
    let cloudQRs: Record<string, DynamicQRRecord> = {};
    if (typeof rawCloud === 'string' && rawCloud) {
      try {
        cloudQRs = JSON.parse(rawCloud);
      } catch {
        cloudQRs = {};
      }
    }
    const deletedSet = globalThis.__spotqrDeletedQRSlugs;
    if (deletedSet && deletedSet.size > 0) {
      for (const delSlug of Array.from(deletedSet)) {
        delete cloudQRs[delSlug];
      }
      deletedSet.clear();
    }
    const merged = {
      ...cloudQRs,
      ...(db.dynamicQRs || {}),
    };
    db.dynamicQRs = merged;
    saveDb(db);
    await kvRequest(['SET', 'spotqr:qrs', JSON.stringify(merged)]);
    return;
  }

  const map: Record<CloudSliceKey, unknown> = {
    users: db.users || {},
    qrs: db.dynamicQRs || {},
    payments: db.payments || {},
    redirects: db.slugRedirects || {},
    leads: db.developerLeads || {},
    notifications: db.developerNotifications || {},
    settings: db.developerSettings || initialData.developerSettings,
    vouchers: db.vouchers || {},
    resets: db.passwordResets || {},
    orders: db.orders || {},
  };
  await kvRequest(['SET', `spotqr:${slice}`, JSON.stringify(map[slice])]);
}

export async function persistMenuToCloud(menu: RestaurantMenu): Promise<void> {
  if (!menu?.slug || !getCloudKVConfig()) return;
  await kvRequest(['SET', `spotqr:menu:${menu.slug}`, JSON.stringify(menu)]);
}

export async function deleteCloudMenu(slug: string): Promise<void> {
  if (!slug || !getCloudKVConfig()) return;
  await kvRequest(['DEL', `spotqr:menu:${slug}`]);
}

declare global {
  // eslint-disable-next-line no-var
  var __spotqrPendingMenuMoves: Array<{ from: string; to: string }> | undefined;
  // eslint-disable-next-line no-var
  var __spotqrDeletedQRSlugs: Set<string> | undefined;
}

function markDeletedQRSlug(slug: string) {
  if (!slug) return;
  if (!globalThis.__spotqrDeletedQRSlugs) {
    globalThis.__spotqrDeletedQRSlugs = new Set<string>();
  }
  globalThis.__spotqrDeletedQRSlugs.add(slug);
}

function queueCloudMenuMove(from: string, to: string) {
  if (!from || !to || from === to) return;
  const list = globalThis.__spotqrPendingMenuMoves || [];
  list.push({ from, to });
  globalThis.__spotqrPendingMenuMoves = list;
}

export async function reconcileCloudSlugMigrations(): Promise<void> {
  const list = globalThis.__spotqrPendingMenuMoves || [];
  if (list.length === 0) return;
  globalThis.__spotqrPendingMenuMoves = [];
  const db = ensureDb();
  for (const { from, to } of list) {
    if (!db.menus[to]) {
      await syncMenuFromCloud(from);
      const loaded = db.menus[from];
      if (loaded) {
        db.menus[to] = {
          ...loaded,
          id: to,
          slug: to,
          updatedAt: new Date().toISOString(),
        };
        delete db.menus[from];
        saveDb(db);
      }
    }
    if (db.menus[to]) {
      await persistMenuToCloud(db.menus[to]);
    }
    await deleteCloudMenu(from);
  }
  await Promise.all([
    persistSliceToCloud('qrs'),
    persistSliceToCloud('redirects'),
  ]);
}

function assignUniqueStoreCode(
  db: DatabaseSchema,
  record: DynamicQRRecord
): string {
  if (record.storeCode && /^\d+$/.test(record.storeCode)) {
    return record.storeCode;
  }
  const used = new Set(
    Object.values(db.dynamicQRs || {})
      .map((q) => q.storeCode)
      .filter(Boolean)
  );
  let candidate = computeStableStoreCode(record);
  while (used.has(candidate)) {
    candidate = String(100000 + Math.floor(Math.random() * 900000));
  }
  return candidate;
}

function moveShowcaseSlugInDb(
  db: DatabaseSchema,
  fromSlug: string,
  toSlug: string,
  nowIso: string
) {
  const existingQR = db.dynamicQRs[fromSlug];
  if (!existingQR || fromSlug === toSlug) return;

  const isCatalog = existingQR.type === 'catalog';
  const expectedPrefix = isCatalog ? `/catalogo/${fromSlug}` : `/cardapio/${fromSlug}`;
  const altPrefix = isCatalog ? `/cardapio/${fromSlug}` : `/catalogo/${fromSlug}`;
  let nextTargetUrl = existingQR.targetUrl;
  if (
    !nextTargetUrl ||
    nextTargetUrl === expectedPrefix ||
    nextTargetUrl === altPrefix ||
    nextTargetUrl.endsWith(`/${fromSlug}`)
  ) {
    nextTargetUrl = `/${isCatalog ? 'catalogo' : 'cardapio'}/${toSlug}`;
  }

  delete db.dynamicQRs[fromSlug];
  markDeletedQRSlug(fromSlug);
  if (globalThis.__spotqrDeletedQRSlugs) {
    globalThis.__spotqrDeletedQRSlugs.delete(toSlug);
  }

  const movedQR: DynamicQRRecord = {
    ...existingQR,
    slug: toSlug,
    targetUrl: nextTargetUrl,
    linkedMenuId: toSlug,
    updatedAt: nowIso,
  };
  db.dynamicQRs[toSlug] = movedQR;

  // Move menu in memory if present
  const existingMenu = db.menus[fromSlug];
  if (existingMenu) {
    delete db.menus[fromSlug];
    db.menus[toSlug] = {
      ...existingMenu,
      id: toSlug,
      slug: toSlug,
      originalSlug: existingQR.originalSlug || existingMenu.originalSlug,
      updatedAt: nowIso,
    };
  }
  queueCloudMenuMove(fromSlug, toSlug);
}

/**
 * Reverts an expired/unrenewed PRO store back to Free:
 * - Clears isPaid / proExpiresAt / proGrantType
 * - Blocks PRO features automatically (ads back, coverVideo hidden -> static coverImage)
 * - If a custom friendly link was configured while PRO, reverts slug back to originalSlug
 */
export function applyFreeDowngradeInDb(
  db: DatabaseSchema,
  qr: DynamicQRRecord,
  nowMs: number = Date.now(),
  markSuspendedFree: boolean = false
): DynamicQRRecord {
  const nowIso = new Date(nowMs).toISOString();
  const currentSlug = qr.slug;

  qr.isPaid = false;
  qr.proExpiresAt = null;
  qr.proGrantType = undefined;
  qr.proGrantedHours = undefined;
  qr.proVoucherCode = undefined;
  qr.hadProExpired = true;
  qr.updatedAt = nowIso;

  if (qr.autoRenew) {
    qr.autoRenew = {
      ...qr.autoRenew,
      enabled: false,
      status: markSuspendedFree ? 'suspended_free' : qr.autoRenew.status,
      graceStartedAt: null,
      graceEndsAt: null,
    };
  }

  // Revert custom friendly PRO slug back to previous originalSlug
  if (qr.originalSlug && qr.originalSlug !== currentSlug) {
    const original = qr.originalSlug;
    qr.customSlug = undefined;
    if (db.slugRedirects) {
      delete db.slugRedirects[original];
    }
    db.dynamicQRs[currentSlug] = qr;
    moveShowcaseSlugInDb(db, currentSlug, original, nowIso);
    return db.dynamicQRs[original];
  }

  db.dynamicQRs[currentSlug] = qr;
  return qr;
}

export function resolveEffectiveSlug(slug: string): string {
  const db = ensureDb();
  if (db.dynamicQRs[slug]) return slug;
  const redirected = db.slugRedirects?.[slug];
  if (redirected && db.dynamicQRs[redirected]) {
    return redirected;
  }
  return slug;
}

export function isFriendlySlugAvailable(
  rawCandidate: string,
  currentStoreSlug?: string
): { available: boolean; normalized: string; reason?: string } {
  const normalized = normalizeFriendlySlug(rawCandidate);
  const check = isValidFriendlySlugFormat(normalized);
  if (!check.valid) {
    return { available: false, normalized, reason: check.reason };
  }
  if (currentStoreSlug && normalized === currentStoreSlug) {
    return { available: true, normalized };
  }

  const db = ensureDb();
  if (db.dynamicQRs[normalized]) {
    return {
      available: false,
      normalized,
      reason: 'Este link já está em uso por outro usuário. Escolha outra opção.',
    };
  }

  for (const qr of Object.values(db.dynamicQRs || {})) {
    if (qr.slug === currentStoreSlug) continue;
    if (qr.originalSlug === normalized || qr.customSlug === normalized) {
      return {
        available: false,
        normalized,
        reason: 'Este link está reservado por outra loja.',
      };
    }
  }

  const redirectOwner = db.slugRedirects?.[normalized];
  if (redirectOwner && redirectOwner !== currentStoreSlug) {
    return {
      available: false,
      normalized,
      reason: 'Este link já pertence a outra loja ativa.',
    };
  }

  return { available: true, normalized };
}

export function updateFriendlySlugForQR(
  currentSlug: string,
  requestedNewSlug: string
): { ok: boolean; error?: string; qr?: DynamicQRRecord; previousSlug?: string } {
  expireDueQRsIfAny();
  const db = ensureDb();
  const qr = db.dynamicQRs[currentSlug];
  if (!qr) {
    return { ok: false, error: 'Loja / QR Code não encontrado.' };
  }
  if (!isProStillValid(qr)) {
    return {
      ok: false,
      error: 'A personalização de link amigável é exclusiva do Plano PRO.',
    };
  }

  const availability = isFriendlySlugAvailable(requestedNewSlug, currentSlug);
  if (!availability.available) {
    return {
      ok: false,
      error: availability.reason || 'Este link não está disponível.',
    };
  }

  const nextSlug = availability.normalized;
  if (nextSlug === currentSlug) {
    return { ok: true, qr, previousSlug: currentSlug };
  }

  const nowIso = new Date().toISOString();
  const originalSlug = qr.originalSlug || currentSlug;
  qr.originalSlug = originalSlug;
  qr.customSlug = nextSlug;
  if (!db.slugRedirects) db.slugRedirects = {};
  // Keep previous free URL redirecting seamlessly to the new PRO friendly URL while PRO is active
  if (originalSlug !== nextSlug) {
    db.slugRedirects[originalSlug] = nextSlug;
  }
  if (currentSlug !== originalSlug) {
    delete db.slugRedirects[currentSlug];
  }

  db.dynamicQRs[currentSlug] = qr;
  moveShowcaseSlugInDb(db, currentSlug, nextSlug, nowIso);
  saveDb(db);

  return {
    ok: true,
    qr: db.dynamicQRs[nextSlug],
    previousSlug: currentSlug,
  };
}

/**
 * Checks all non-demo QRs and automatically reverts expired temporary/voucher PRO plans back to Free.
 * Returns true if any record changed so callers can persist updated QR state to cloud.
 */
export function expireDueQRsIfAny(nowMs: number = Date.now()): boolean {
  const db = ensureDb();
  let changed = false;

  for (const slug of Object.keys(db.dynamicQRs || {})) {
    const qr = db.dynamicQRs[slug];
    if (!qr) continue;
    if (slug === 'demo-restaurante' || slug === 'demo-catalogo') continue;

    if (!qr.storeCode) {
      qr.storeCode = assignUniqueStoreCode(db, qr);
      changed = true;
    }

    if (qr.isPaid && !isProStillValid(qr, nowMs)) {
      applyFreeDowngradeInDb(db, qr, nowMs, Boolean(qr.autoRenew?.enabled));
      changed = true;
    }
  }

  // Also clear expired pre-store voucher credit on client users
  for (const uid of Object.keys(db.users || {})) {
    const user = db.users?.[uid];
    if (user?.proCreditExpiresAt) {
      const exp = new Date(user.proCreditExpiresAt).getTime();
      if (Number.isFinite(exp) && nowMs >= exp) {
        user.proCreditExpiresAt = null;
        user.proCreditVoucherCode = undefined;
        user.proCreditDays = undefined;
        changed = true;
      }
    }
  }

  if (changed) {
    saveDb(db);
  }
  return changed;
}

// DYNAMIC QR CRUD
export function getDynamicQRBySlug(slug: string): DynamicQRRecord | null {
  const db = ensureDb();
  return db.dynamicQRs[slug] || null;
}

export function getAllDynamicQRs(): DynamicQRRecord[] {
  const db = ensureDb();
  return Object.values(db.dynamicQRs);
}

export function saveDynamicQR(record: DynamicQRRecord): void {
  const db = ensureDb();
  if (!record.storeCode && record.slug !== 'demo-restaurante' && record.slug !== 'demo-catalogo') {
    record.storeCode = assignUniqueStoreCode(db, record);
  }
  db.dynamicQRs[record.slug] = record;

  // If this QR is of type 'menu' or 'catalog' and no menu/catalog exists for this slug yet, auto-create!
  if ((record.type === 'menu' || record.type === 'catalog') && !db.menus[record.slug]) {
    if (record.type === 'catalog') {
      db.menus[record.slug] = createStarterCatalog(
        record.slug,
        record.title || `Catálogo ${record.slug}`,
        record.qrConfig?.whatsappPhone || '5511999998888',
        record.qrConfig?.pixKey || 'pix@minhaloja.com.br'
      );
    } else {
      db.menus[record.slug] = createStarterMenu(
        record.slug,
        record.title || `Cardápio ${record.slug}`,
        record.qrConfig?.whatsappPhone || '5511999998888',
        record.qrConfig?.pixKey || 'pix@restaurante.com.br'
      );
    }
  }

  saveDb(db);
}

export function incrementQRScan(slug: string): void {
  const db = ensureDb();
  const record = db.dynamicQRs[slug];
  if (record) {
    record.scansCount = (record.scansCount || 0) + 1;
    record.lastScannedAt = new Date().toISOString();
    saveDb(db);
  }
}

// RESTAURANT MENU & STORE CATALOG CRUD
export function peekExistingMenuBySlug(slug: string): RestaurantMenu | null {
  const db = ensureDb();
  return db.menus[slug] || null;
}

export function getMenuBySlug(
  slug: string,
  defaultMode: 'menu' | 'catalog' = 'menu',
  fallbackTitle?: string
): RestaurantMenu | null {
  const db = ensureDb();
  if (db.menus[slug]) {
    return db.menus[slug];
  }
  // If user visits /cardapio/[slug] or /catalogo/[slug] for a valid or new slug, auto-provision starter showcase so it never 404s!
  const qr = db.dynamicQRs[slug];
  const resolvedMode = qr?.type === 'catalog' ? 'catalog' : defaultMode;
  const formattedTitle =
    qr?.title ||
    fallbackTitle ||
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const autoMenu =
    resolvedMode === 'catalog'
      ? createStarterCatalog(
          slug,
          formattedTitle,
          qr?.qrConfig?.whatsappPhone || '5511999998888',
          qr?.qrConfig?.pixKey || 'pix@minhaloja.com.br'
        )
      : createStarterMenu(
          slug,
          formattedTitle,
          qr?.qrConfig?.whatsappPhone || '5511999998888',
          qr?.qrConfig?.pixKey || 'pix@restaurante.com.br'
        );
  db.menus[slug] = autoMenu;
  saveDb(db);
  return autoMenu;
}

export function saveMenu(menu: RestaurantMenu): void {
  const db = ensureDb();
  db.menus[menu.slug] = menu;
  saveDb(db);
}

// PAYMENTS & NOTIFICATIONS
function sendExternalMobilePush(
  title: string,
  message: string,
  tags: string = 'moneybag,bell',
  topicOverride?: string
) {
  try {
    const db = ensureDb();
    const topic = (
      topicOverride ||
      db.developerSettings?.ntfyTopic ||
      'spotqr-edvan-alertas-1982'
    ).trim();
    if (!topic) return;

    fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        Title: title.replace(/[^\x20-\x7EÀ-ÿ]/g, ''),
        Priority: 'high',
        Tags: tags,
      },
      body: `${title}\n${message}`,
    }).catch(() => {});
  } catch {
    // Non-blocking background push
  }
}

export function createDeveloperNotification(input: {
  type: DeveloperNotificationType;
  title: string;
  message: string;
  amount?: number;
  clientName?: string;
  contact?: string;
  slug?: string;
}): DeveloperNotification {
  const db = ensureDb();
  if (!db.developerNotifications) {
    db.developerNotifications = {};
  }
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const notif: DeveloperNotification = {
    id,
    type: input.type,
    title: input.title,
    message: input.message,
    amount: input.amount,
    clientName: input.clientName,
    contact: input.contact,
    slug: input.slug,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.developerNotifications[id] = notif;
  saveDb(db);

  const pushTags =
    input.type === 'subscription_paid'
      ? 'moneybag,white_check_mark'
      : input.type === 'new_lead'
      ? 'speech_balloon,sparkles'
      : 'bell';
  sendExternalMobilePush(input.title, input.message, pushTags);

  return notif;
}

export function getAllDeveloperNotifications(): DeveloperNotification[] {
  const db = ensureDb();
  return Object.values(db.developerNotifications || {}).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function markAllDeveloperNotificationsRead(): void {
  const db = ensureDb();
  if (!db.developerNotifications) return;
  for (const key of Object.keys(db.developerNotifications)) {
    db.developerNotifications[key].isRead = true;
  }
  saveDb(db);
}

export function recordPayment(
  paymentId: string,
  slug: string,
  status: string,
  amount: number,
  clientName?: string,
  clientEmail?: string
) {
  const db = ensureDb();
  const prevPayment = db.payments[paymentId];
  const wasAlreadyApproved = prevPayment?.status === 'approved';
  const qr = db.dynamicQRs[slug];
  const resolvedClientName =
    clientName ||
    prevPayment?.clientName ||
    qr?.title ||
    qr?.ownerEmail ||
    slug;
  const resolvedClientEmail =
    clientEmail || prevPayment?.clientEmail || qr?.ownerEmail || '';

  const now = new Date().toISOString();
  db.payments[paymentId] = {
    id: paymentId,
    slug,
    clientName: resolvedClientName,
    clientEmail: resolvedClientEmail,
    status,
    amount,
    createdAt: prevPayment?.createdAt || now,
    approvedAt: status === 'approved' ? prevPayment?.approvedAt || now : undefined,
  };

  if (status === 'approved' && db.dynamicQRs[slug]) {
    const qr = db.dynamicQRs[slug];
    const nowMs = Date.now();
    const existingExpMs = qr.proExpiresAt
      ? new Date(qr.proExpiresAt).getTime()
      : 0;
    const baseMs =
      qr.isPaid && Number.isFinite(existingExpMs) && existingExpMs > nowMs
        ? existingExpMs
        : nowMs;
    const newExpiresIso = new Date(
      baseMs + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    qr.isPaid = true;
    qr.hadProExpired = false;
    qr.proGrantType = 'paid';
    qr.proExpiresAt = newExpiresIso;
    qr.paymentId = paymentId;
    qr.updatedAt = now;
    if (qr.autoRenew) {
      qr.autoRenew = {
        ...qr.autoRenew,
        status: qr.autoRenew.enabled ? 'active' : qr.autoRenew.status,
        nextBillingAt: newExpiresIso,
        graceStartedAt: null,
        graceEndsAt: null,
        retryCount: 0,
        executedSlots: [],
        lastError: null,
      };
    }
  }
  saveDb(db);

  // Trigger mobile notifications
  if (status === 'approved' && !wasAlreadyApproved) {
    createDeveloperNotification({
      type: 'subscription_paid',
      title: `💰 Nova Assinatura PRO Paga! (+ R$ ${amount
        .toFixed(2)
        .replace('.', ',')})`,
      message: `${resolvedClientName} concluiu o pagamento da assinatura PRO para /${slug}.`,
      amount,
      clientName: resolvedClientName,
      slug,
    });
  } else if (status === 'pending' && !prevPayment) {
    createDeveloperNotification({
      type: 'subscription_pending',
      title: `⏳ Novo PIX / Checkout Gerado (R$ ${amount
        .toFixed(2)
        .replace('.', ',')})`,
      message: `${resolvedClientName} abriu o checkout do Plano PRO para /${slug} (ID: ${paymentId}).`,
      amount,
      clientName: resolvedClientName,
      slug,
    });
  }
}

export function getPayment(paymentId: string) {
  const db = ensureDb();
  return db.payments[paymentId] || null;
}

export function getSubscriptionAnalytics() {
  const db = ensureDb();
  // Exclude visitor showcases ('demo-restaurante', 'demo-catalogo') from real business metrics
  const realCustomerQRs = Object.values(db.dynamicQRs || {}).filter(
    (q) => q.slug !== 'demo-restaurante' && q.slug !== 'demo-catalogo'
  );
  const allPayments = Object.values(db.payments || {}).filter(
    (p) =>
      p.slug !== 'demo-restaurante' &&
      p.slug !== 'demo-catalogo' &&
      !p.id.startsWith('demo_')
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayDateStr = now.toISOString().slice(0, 10);

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const currentMonthLabel = `${monthNames[currentMonth]} / ${currentYear}`;

  const approvedPayments = allPayments.filter((p) => p.status === 'approved');
  const pendingPayments = allPayments.filter((p) => p.status === 'pending');

  const monthlyApproved = approvedPayments.filter((p) => {
    const dt = new Date(p.approvedAt || p.createdAt);
    return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
  });

  const todayApproved = approvedPayments.filter((p) => {
    const dtStr = (p.approvedAt || p.createdAt).slice(0, 10);
    return dtStr === todayDateStr;
  });

  const monthlyApprovedCount = monthlyApproved.length;
  const monthlyRevenue = monthlyApproved.reduce(
    (acc, p) => acc + (Number(p.amount) || 10.9),
    0
  );

  const todayApprovedCount = todayApproved.length;
  const todayRevenue = todayApproved.reduce(
    (acc, p) => acc + (Number(p.amount) || 10.9),
    0
  );

  const totalActiveProCount = realCustomerQRs.filter((q) =>
    isProStillValid(q)
  ).length;
  const totalAllTimeRevenue = approvedPayments.reduce(
    (acc, p) => acc + (Number(p.amount) || 10.9),
    0
  );

  const sortedPayments = [...allPayments].sort(
    (a, b) =>
      new Date(b.approvedAt || b.createdAt).getTime() -
      new Date(a.approvedAt || a.createdAt).getTime()
  );

  return {
    currentMonthLabel,
    monthlyApprovedCount,
    monthlyRevenue,
    todayApprovedCount,
    todayRevenue,
    totalActiveProCount,
    totalAllTimeRevenue,
    pendingPaymentsCount: pendingPayments.length,
    paymentsList: sortedPayments.slice(0, 50),
  };
}

// DEVELOPER LEADS & SETTINGS CRUD
export function getAllDeveloperLeads(): DeveloperLead[] {
  const db = ensureDb();
  const leads = Object.values(db.developerLeads || {});
  return leads.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createDeveloperLead(
  input: Omit<DeveloperLead, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): DeveloperLead {
  const db = ensureDb();
  if (!db.developerLeads) {
    db.developerLeads = {};
  }
  const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const newLead: DeveloperLead = {
    ...input,
    id,
    status: 'novo',
    createdAt: now,
    updatedAt: now,
  };
  db.developerLeads[id] = newLead;
  saveDb(db);

  createDeveloperNotification({
    type: 'new_lead',
    title: `💬 Nova Proposta: ${input.serviceLabel}`,
    message: `${input.name}${
      input.businessName ? ` (${input.businessName})` : ''
    } enviou pedido de orçamento (${
      input.budgetRange || 'A combinar'
    }) • Contato: ${input.contact}`,
    clientName: input.name,
    contact: input.contact,
  });

  return newLead;
}

export function updateDeveloperLead(
  id: string,
  updates: Partial<DeveloperLead>
): DeveloperLead | null {
  const db = ensureDb();
  if (!db.developerLeads || !db.developerLeads[id]) {
    return null;
  }
  const updated: DeveloperLead = {
    ...db.developerLeads[id],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  db.developerLeads[id] = updated;
  saveDb(db);
  return updated;
}

export function deleteDeveloperLead(id: string): boolean {
  const db = ensureDb();
  if (!db.developerLeads || !db.developerLeads[id]) {
    return false;
  }
  delete db.developerLeads[id];
  saveDb(db);
  return true;
}

export function getDeveloperSettings(): DeveloperSettings {
  const db = ensureDb();
  return (
    db.developerSettings || {
      developerName: 'Desenvolvedor Full-Stack & Especialista em IA',
      developerWhatsapp: '5511999998888',
      developerEmail: 'dev@spotqr.pro',
      agencyHeadline:
        'Desenvolvemos Sites, IA de Atendimento 24h, Sistemas de Agendamento para Clínicas, Salões de Beleza, Barbearias e Restaurantes.',
      availableForProjects: true,
    }
  );
}

export function saveDeveloperSettings(
  settings: Partial<DeveloperSettings>
): DeveloperSettings {
  const db = ensureDb();
  const current = getDeveloperSettings();
  const updated: DeveloperSettings = {
    ...current,
    ...settings,
  };
  db.developerSettings = updated;
  saveDb(db);
  return updated;
}

// CLIENT USERS CRUD
export function getClientUserByEmail(email: string): ClientUser | null {
  const db = ensureDb();
  const clean = (email || '').trim().toLowerCase();
  const matches = Object.values(db.users || {}).filter(
    (u) => u.email.toLowerCase() === clean
  );
  return matches.find((u) => Boolean(u.passwordHash)) || matches[0] || null;
}

export function getClientUserById(id: string): ClientUser | null {
  const db = ensureDb();
  return (db.users && db.users[id]) || null;
}

export function getAllClientUsers(): ClientUser[] {
  const db = ensureDb();
  return Object.values(db.users || {});
}

export function createClientUser(input: {
  name: string;
  businessName: string;
  email: string;
  whatsapp: string;
  passwordPlain: string;
}): ClientUser {
  const db = ensureDb();
  if (!db.users) db.users = {};

  const cleanEmail = input.email.trim().toLowerCase();
  const existingMatches = Object.values(db.users).filter(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  const existingWithPassword = existingMatches.find((u) =>
    Boolean(u.passwordHash)
  );
  if (existingWithPassword) {
    throw new Error('Já existe uma conta cadastrada com este e-mail/login.');
  }

  // If a passwordless session stub exists from before cloud DB sync, upgrade it in place
  const stub = existingMatches[0];
  const id =
    stub?.id ||
    `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const initialRecovery = generateFormattedSecurityCode('SPOT-REC');
  const user: ClientUser = {
    id,
    name: input.name.trim(),
    businessName: (input.businessName || input.name).trim(),
    email: cleanEmail,
    whatsapp: (input.whatsapp || '').trim(),
    passwordHash: hashPasswordSecure(input.passwordPlain),
    sessionVersion: (stub?.sessionVersion ?? 0) + 1,
    recoveryCodeHash: initialRecovery.hash,
    recoveryCodeHint: initialRecovery.hint,
    createdAt: stub?.createdAt || new Date().toISOString(),
  };

  db.users[id] = user;
  saveDb(db);

  createDeveloperNotification({
    type: 'new_client',
    title: `👤 Novo Cliente Cadastrado: ${user.businessName}`,
    message: `${user.name} criou conta no site (${user.email}) • WhatsApp: ${
      user.whatsapp || 'Não informado'
    }`,
    clientName: `${user.name} (${user.businessName})`,
    contact: user.whatsapp || user.email,
  });

  return { ...user, plainBackupCode: initialRecovery.plain } as ClientUser & {
    plainBackupCode: string;
  };
}

export function restoreClientUserFromSession(
  profile: Omit<ClientUser, 'passwordHash'>
): ClientUser {
  const db = ensureDb();
  if (!db.users) db.users = {};

  const existingById = db.users[profile.id];
  if (existingById) return existingById;

  const cleanEmail = (profile.email || '').trim().toLowerCase();
  const existingByEmail = Object.values(db.users).find(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  if (existingByEmail) return existingByEmail;

  const restored: ClientUser = {
    ...profile,
    email: cleanEmail,
    passwordHash: '',
  };
  db.users[restored.id] = restored;
  saveDb(db);
  return restored;
}

export function getDynamicQRsByOwner(
  ownerId: string,
  ownerEmail?: string
): DynamicQRRecord[] {
  const db = ensureDb();
  const all = Object.values(db.dynamicQRs || {});
  return all.filter(
    (qr) =>
      qr.ownerId === ownerId ||
      (ownerEmail &&
        qr.ownerEmail &&
        qr.ownerEmail.toLowerCase() === ownerEmail.toLowerCase())
  );
}

// ADMIN PRO GRANT / REVOKE & STORE DIRECTORY
export function getAdminStoresList(): AdminStoreSummary[] {
  expireDueQRsIfAny();
  const db = ensureDb();
  const usersById = db.users || {};
  const usersByEmail = new Map<string, ClientUser>();
  for (const u of Object.values(usersById)) {
    if (u.email) usersByEmail.set(u.email.toLowerCase(), u);
  }

  return Object.values(db.dynamicQRs || {})
    .filter((q) => q.slug !== 'demo-restaurante' && q.slug !== 'demo-catalogo')
    .map((qr) => {
      const owner =
        (qr.ownerId && usersById[qr.ownerId]) ||
        (qr.ownerEmail && usersByEmail.get(qr.ownerEmail.toLowerCase())) ||
        null;
      const effectivePaid = isProStillValid(qr);
      return {
        id: qr.id,
        storeCode: qr.storeCode || assignUniqueStoreCode(db, qr),
        slug: qr.slug,
        title: qr.title || owner?.businessName || qr.slug,
        type: qr.type,
        isPaid: effectivePaid,
        proGrantType: effectivePaid ? qr.proGrantType : undefined,
        proExpiresAt: effectivePaid ? qr.proExpiresAt || null : null,
        proGrantedAt: qr.proGrantedAt,
        proGrantedHours: qr.proGrantedHours,
        proVoucherCode: qr.proVoucherCode,
        scansCount: qr.scansCount || 0,
        ownerId: qr.ownerId || owner?.id,
        ownerName: owner?.name || owner?.businessName || '',
        ownerEmail: qr.ownerEmail || owner?.email || '',
        ownerWhatsapp: owner?.whatsapp || '',
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
}

export function grantProToQR(input: {
  slug: string;
  mode: 'indeterminate' | 'days_30' | 'hours';
  hours?: number;
  minutes?: number;
}): DynamicQRRecord | null {
  const db = ensureDb();
  const qr = db.dynamicQRs[input.slug];
  if (!qr) return null;

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  let expiresAt: string | null = null;
  let grantedHours: number | undefined = undefined;

  if (input.mode === 'days_30') {
    expiresAt = new Date(nowMs + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (input.mode === 'hours') {
    const h = Math.max(0, Number(input.hours) || 0);
    const m = Math.max(0, Number(input.minutes) || 0);
    const totalMinutes = Math.max(1, Math.round(h * 60 + m));
    expiresAt = new Date(nowMs + totalMinutes * 60 * 1000).toISOString();
    grantedHours = Number((totalMinutes / 60).toFixed(2));
  }

  qr.isPaid = true;
  qr.hadProExpired = false;
  qr.proGrantType = input.mode;
  qr.proExpiresAt = expiresAt;
  qr.proGrantedAt = nowIso;
  qr.proGrantedHours = grantedHours;
  qr.proVoucherCode = undefined;
  qr.updatedAt = nowIso;
  if (qr.autoRenew?.enabled && expiresAt) {
    qr.autoRenew.nextBillingAt = expiresAt;
  }
  if (!qr.storeCode) {
    qr.storeCode = assignUniqueStoreCode(db, qr);
  }

  db.dynamicQRs[input.slug] = qr;
  saveDb(db);
  return qr;
}

export function revokeProFromQR(slug: string): DynamicQRRecord | null {
  const db = ensureDb();
  const qr = db.dynamicQRs[slug];
  if (!qr) return null;

  const updated = applyFreeDowngradeInDb(db, qr, Date.now(), false);
  saveDb(db);
  return updated;
}

export function updateQRAutoRenew(
  slug: string,
  autoRenew: DynamicQRRecord['autoRenew']
): DynamicQRRecord | null {
  const db = ensureDb();
  const qr = db.dynamicQRs[slug];
  if (!qr) return null;
  qr.autoRenew = autoRenew;
  qr.updatedAt = new Date().toISOString();
  db.dynamicQRs[slug] = qr;
  saveDb(db);
  return qr;
}

export function downgradeQRToFreePublic(
  slug: string,
  markSuspendedFree: boolean = false
): DynamicQRRecord | null {
  const db = ensureDb();
  const qr = db.dynamicQRs[slug];
  if (!qr) return null;
  const updated = applyFreeDowngradeInDb(
    db,
    qr,
    Date.now(),
    markSuspendedFree
  );
  saveDb(db);
  return updated;
}

// PRO VOUCHERS CRUD & REDEMPTION
function generateVoucherCode(days: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SPOT-${days}D-${suffix}`;
}

export function createProVoucher(input: {
  days: number;
  recipientHint?: string;
}): ProVoucher {
  const db = ensureDb();
  if (!db.vouchers) db.vouchers = {};

  const safeDays = Math.min(365, Math.max(1, Math.round(Number(input.days) || 7)));
  const existingCodes = new Set(
    Object.values(db.vouchers).map((v) => v.code.toUpperCase())
  );

  let code = generateVoucherCode(safeDays);
  while (existingCodes.has(code)) {
    code = generateVoucherCode(safeDays);
  }

  const id = `voucher-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const voucher: ProVoucher = {
    id,
    code,
    days: safeDays,
    recipientHint: input.recipientHint ? input.recipientHint.trim() : undefined,
    createdAt: new Date().toISOString(),
    createdBy: 'Edvan Dev',
    isRedeemed: false,
  };

  db.vouchers[id] = voucher;
  saveDb(db);
  return voucher;
}

export function getAllProVouchers(): ProVoucher[] {
  const db = ensureDb();
  return Object.values(db.vouchers || {}).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteProVoucher(id: string): boolean {
  const db = ensureDb();
  if (!db.vouchers || !db.vouchers[id]) return false;
  delete db.vouchers[id];
  saveDb(db);
  return true;
}

export function consumeUserProCreditIfActive(
  userId?: string,
  userEmail?: string
): {
  isPaid: boolean;
  proExpiresAt?: string | null;
  proGrantType?: DynamicQRRecord['proGrantType'];
  proVoucherCode?: string;
} {
  if (!userId && !userEmail) return { isPaid: false };
  const db = ensureDb();
  const user =
    (userId && db.users?.[userId]) ||
    (userEmail
      ? Object.values(db.users || {}).find(
          (u) => u.email.toLowerCase() === userEmail.toLowerCase()
        )
      : undefined);

  if (!user || !user.proCreditExpiresAt) {
    return { isPaid: false };
  }

  const expMs = new Date(user.proCreditExpiresAt).getTime();
  if (!Number.isFinite(expMs) || Date.now() >= expMs) {
    user.proCreditExpiresAt = null;
    user.proCreditVoucherCode = undefined;
    user.proCreditDays = undefined;
    saveDb(db);
    return { isPaid: false };
  }

  const result = {
    isPaid: true,
    proExpiresAt: user.proCreditExpiresAt,
    proGrantType: 'voucher' as const,
    proVoucherCode: user.proCreditVoucherCode,
  };

  user.proCreditExpiresAt = null;
  user.proCreditVoucherCode = undefined;
  user.proCreditDays = undefined;
  saveDb(db);

  return result;
}

export function redeemProVoucher(input: {
  code: string;
  userId: string;
  userEmail: string;
  userName: string;
  businessName?: string;
  slug?: string;
}): {
  voucher: ProVoucher;
  slug?: string;
  storeName?: string;
  proExpiresAt: string;
  creditOnly: boolean;
} {
  expireDueQRsIfAny();
  const db = ensureDb();
  if (!db.vouchers) db.vouchers = {};

  const normalizedCode = (input.code || '').trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error('Digite o código do voucher.');
  }

  const voucher = Object.values(db.vouchers).find(
    (v) => v.code.toUpperCase() === normalizedCode
  );
  if (!voucher) {
    throw new Error('Código voucher não encontrado. Verifique e tente novamente.');
  }
  if (voucher.isRedeemed) {
    throw new Error('Este código voucher já foi utilizado anteriormente.');
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const expiresIso = new Date(
    nowMs + voucher.days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Resolve target store/QR for this user
  let targetQR: DynamicQRRecord | null = null;
  if (input.slug && input.slug !== 'demo-restaurante' && input.slug !== 'demo-catalogo') {
    const candidate = db.dynamicQRs[input.slug];
    if (
      candidate &&
      (input.userId === 'admin' ||
        candidate.ownerId === input.userId ||
        (candidate.ownerEmail &&
          candidate.ownerEmail.toLowerCase() === input.userEmail.toLowerCase()))
    ) {
      targetQR = candidate;
    }
  }

  if (!targetQR) {
    const userQRs = getDynamicQRsByOwner(input.userId, input.userEmail).filter(
      (q) => q.slug !== 'demo-restaurante' && q.slug !== 'demo-catalogo'
    );
    targetQR = userQRs.find((q) => !isProStillValid(q, nowMs)) || userQRs[0] || null;
  }

  let creditOnly = false;
  if (targetQR) {
    targetQR.isPaid = true;
    targetQR.hadProExpired = false;
    targetQR.proGrantType = 'voucher';
    targetQR.proExpiresAt = expiresIso;
    targetQR.proGrantedAt = nowIso;
    targetQR.proGrantedHours = undefined;
    targetQR.proVoucherCode = voucher.code;
    targetQR.updatedAt = nowIso;
    if (targetQR.autoRenew?.enabled) {
      targetQR.autoRenew.nextBillingAt = expiresIso;
    }
    if (!targetQR.storeCode) {
      targetQR.storeCode = assignUniqueStoreCode(db, targetQR);
    }
    db.dynamicQRs[targetQR.slug] = targetQR;
  } else {
    // User logged in before creating their first store -> credit saved to account!
    creditOnly = true;
    if (db.users && db.users[input.userId]) {
      db.users[input.userId].proCreditExpiresAt = expiresIso;
      db.users[input.userId].proCreditVoucherCode = voucher.code;
      db.users[input.userId].proCreditDays = voucher.days;
    }
  }

  voucher.isRedeemed = true;
  voucher.redeemedAt = nowIso;
  voucher.redeemedByUserId = input.userId;
  voucher.redeemedByEmail = input.userEmail;
  voucher.redeemedByName = input.businessName || input.userName;
  voucher.redeemedForSlug = targetQR?.slug;
  voucher.redeemedStoreName = targetQR?.title || input.businessName || input.userName;
  voucher.proExpiresAt = expiresIso;
  db.vouchers[voucher.id] = voucher;

  saveDb(db);

  createDeveloperNotification({
    type: 'voucher_redeemed',
    title: `🎟️ Voucher PRO Resgatado (${voucher.days} dias)!`,
    message: `${voucher.redeemedByName} (${input.userEmail}) ativou o código ${voucher.code}${
      targetQR ? ` em /${targetQR.slug}` : ' na conta (próxima loja)'
    }.`,
    clientName: voucher.redeemedByName,
    contact: input.userEmail,
    slug: targetQR?.slug,
  });

  return {
    voucher,
    slug: targetQR?.slug,
    storeName: targetQR?.title,
    proExpiresAt: expiresIso,
    creditOnly,
  };
}

// --- SECURITY, PASSWORD RECOVERY & ANTI-PIX-HIJACK HELPERS ---

export function verifyUserPassword(user: ClientUser, plain: string): boolean {
  if (!user || user.isSuspended || !user.passwordHash) return false;
  return verifyPasswordSecure(plain, user.passwordHash);
}

export function changeUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): ClientUser {
  const db = ensureDb();
  const user = db.users?.[input.userId];
  if (!user || user.isSuspended) {
    throw new Error('Conta de cliente não encontrada ou suspensa.');
  }
  if (!verifyUserPassword(user, input.currentPassword)) {
    throw new Error('A senha atual informada está incorreta.');
  }
  if ((input.newPassword || '').length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }
  user.passwordHash = hashPasswordSecure(input.newPassword);
  user.sessionVersion = (user.sessionVersion ?? 1) + 1;
  user.lastPasswordResetAt = new Date().toISOString();
  db.users![user.id] = user;
  saveDb(db);
  return user;
}

export function regenerateBackupRecoveryCodeForUser(input: {
  userId: string;
  currentPassword: string;
}): { code: string; hint: string; user: ClientUser } {
  const db = ensureDb();
  const user = db.users?.[input.userId];
  if (!user || user.isSuspended) {
    throw new Error('Conta de cliente não encontrada ou suspensa.');
  }
  if (!verifyUserPassword(user, input.currentPassword)) {
    throw new Error('Confirme sua senha atual para gerar um novo código secreto.');
  }
  const generated = generateFormattedSecurityCode('SPOT-REC');
  user.recoveryCodeHash = generated.hash;
  user.recoveryCodeHint = generated.hint;
  db.users![user.id] = user;
  saveDb(db);
  return { code: generated.plain, hint: generated.hint, user };
}

export async function createPasswordResetRequest(input: {
  email: string;
  providedWhatsapp: string;
  providedStoreHint?: string;
  providedPixHint?: string;
}): Promise<{
  created: boolean;
  request?: PasswordResetRequest;
  whatsappMatched?: boolean;
}> {
  const db = ensureDb();
  if (!db.passwordResets) db.passwordResets = {};

  const cleanEmail = (input.email || '').trim().toLowerCase();
  const user = getClientUserByEmail(cleanEmail);
  if (!user || !user.passwordHash) {
    return { created: false };
  }

  const ownedQRs = getDynamicQRsByOwner(user.id, user.email).filter(
    (q) => q.slug !== 'demo-restaurante' && q.slug !== 'demo-catalogo'
  );
  let pixHintMatched = false;
  const cleanPixHint = normalizePixKeyForCompare(input.providedPixHint);
  if (cleanPixHint) {
    for (const q of ownedQRs) {
      await syncMenuFromCloud(q.slug);
      const m = db.menus[q.slug];
      if (
        normalizePixKeyForCompare(m?.pixKey) === cleanPixHint ||
        normalizePixKeyForCompare(q.qrConfig?.pixKey) === cleanPixHint
      ) {
        pixHintMatched = true;
        break;
      }
    }
  }

  const whatsappMatched = phonesMatch(user.whatsapp, input.providedWhatsapp);
  const now = Date.now();
  const id = `rst-${now}-${Math.random().toString(36).slice(2, 7)}`;

  const reqRecord: PasswordResetRequest = {
    id,
    userId: user.id,
    email: user.email,
    businessName: user.businessName || user.name,
    registeredWhatsapp: user.whatsapp || '',
    providedWhatsapp: (input.providedWhatsapp || '').trim(),
    whatsappMatched,
    providedStoreHint: (input.providedStoreHint || '').trim() || undefined,
    providedPixHint: (input.providedPixHint || '').trim() || undefined,
    pixHintMatched,
    status: 'pending_admin',
    expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now).toISOString(),
    attempts: 0,
  };

  db.passwordResets[id] = reqRecord;
  saveDb(db);

  createDeveloperNotification({
    type: 'security_alert',
    title: `🔐 Recuperação de Senha: ${reqRecord.businessName}`,
    message: `${user.email} solicitou recuperação. WhatsApp informado: ${
      reqRecord.providedWhatsapp || 'vazio'
    } (${whatsappMatched ? 'CONFERE com cadastro' : '🚨 DIVERGENTE DO CADASTRO!'}). Confirme no WhatsApp oficial antes de liberar.`,
    clientName: reqRecord.businessName,
    contact: user.whatsapp || user.email,
  });

  return { created: true, request: reqRecord, whatsappMatched };
}

export function approvePasswordResetByAdmin(requestId: string): {
  request: PasswordResetRequest;
  plainCode: string;
} {
  const db = ensureDb();
  if (!db.passwordResets) db.passwordResets = {};
  const reqRecord = db.passwordResets[requestId];
  if (!reqRecord) {
    throw new Error('Solicitação de recuperação não encontrada.');
  }
  if (reqRecord.status === 'used' || reqRecord.status === 'rejected') {
    throw new Error('Esta solicitação já foi finalizada anteriormente.');
  }

  const generated = generateFormattedSecurityCode('REC');
  const now = Date.now();
  reqRecord.tokenHash = generated.hash;
  reqRecord.status = 'approved_ready';
  reqRecord.approvedAt = new Date(now).toISOString();
  reqRecord.expiresAt = new Date(now + 30 * 60 * 1000).toISOString();
  reqRecord.attempts = 0;

  db.passwordResets[requestId] = reqRecord;
  saveDb(db);

  return { request: reqRecord, plainCode: generated.plain };
}

export function rejectPasswordResetByAdmin(
  requestId: string
): PasswordResetRequest {
  const db = ensureDb();
  if (!db.passwordResets) db.passwordResets = {};
  const reqRecord = db.passwordResets[requestId];
  if (!reqRecord) {
    throw new Error('Solicitação não encontrada.');
  }
  reqRecord.status = 'rejected';
  reqRecord.tokenHash = undefined;
  db.passwordResets[requestId] = reqRecord;
  saveDb(db);
  return reqRecord;
}

export function completePasswordResetWithCode(input: {
  email: string;
  code: string;
  newPassword: string;
}): { user: ClientUser; mode: 'backup_code' | 'admin_code' } {
  const db = ensureDb();
  if (!db.passwordResets) db.passwordResets = {};

  const cleanEmail = (input.email || '').trim().toLowerCase();
  const user = getClientUserByEmail(cleanEmail);
  if (!user || user.isSuspended || !user.passwordHash) {
    throw new Error('Código inválido, expirado ou dados não conferem.');
  }

  if ((input.newPassword || '').length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // Path 1: User's personal offline Backup Recovery Code
  if (user.recoveryCodeHash && verifySecurityToken(input.code, user.recoveryCodeHash)) {
    user.passwordHash = hashPasswordSecure(input.newPassword);
    user.sessionVersion = (user.sessionVersion ?? 1) + 1;
    user.lastPasswordResetAt = nowIso;
    // Rotate backup code so a leaked backup code cannot be reused twice
    const rotated = generateFormattedSecurityCode('SPOT-REC');
    user.recoveryCodeHash = rotated.hash;
    user.recoveryCodeHint = rotated.hint;
    // Apply 24h anti-PIX-hijack protection after any recovery
    user.pixLockedUntil = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();

    db.users![user.id] = user;
    saveDb(db);

    createDeveloperNotification({
      type: 'security_alert',
      title: `🛡️ Senha Redefinida (Código Pessoal): ${user.businessName}`,
      message: `${user.email} redefiniu a senha com código de backup. Todas as sessões antigas foram encerradas e troca de PIX travada por 24h.`,
      clientName: user.businessName,
      contact: user.whatsapp || user.email,
    });

    return { user, mode: 'backup_code' };
  }

  // Path 2: Single-use 30-min code generated after identity check in /admin
  const candidateReqs = Object.values(db.passwordResets)
    .filter(
      (r) =>
        r.userId === user.id &&
        r.status === 'approved_ready' &&
        Boolean(r.tokenHash)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  for (const reqRecord of candidateReqs) {
    const expMs = new Date(reqRecord.expiresAt).getTime();
    if (!Number.isFinite(expMs) || nowMs > expMs) {
      reqRecord.status = 'expired';
      reqRecord.tokenHash = undefined;
      db.passwordResets[reqRecord.id] = reqRecord;
      saveDb(db);
      continue;
    }

    if ((reqRecord.attempts || 0) >= 5) {
      reqRecord.status = 'rejected';
      reqRecord.tokenHash = undefined;
      db.passwordResets[reqRecord.id] = reqRecord;
      saveDb(db);
      continue;
    }

    if (verifySecurityToken(input.code, reqRecord.tokenHash)) {
      reqRecord.status = 'used';
      reqRecord.usedAt = nowIso;
      reqRecord.tokenHash = undefined;
      db.passwordResets[reqRecord.id] = reqRecord;

      user.passwordHash = hashPasswordSecure(input.newPassword);
      user.sessionVersion = (user.sessionVersion ?? 1) + 1;
      user.lastPasswordResetAt = nowIso;
      // 24h anti-PIX-hijack quarantine after recovery
      user.pixLockedUntil = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
      db.users![user.id] = user;

      saveDb(db);

      createDeveloperNotification({
        type: 'security_alert',
        title: `🛡️ Senha Redefinida via Verificação: ${user.businessName}`,
        message: `${user.email} concluiu a troca de senha. Sessões anteriores encerradas e alteração de Chave PIX bloqueada por 24h por segurança.`,
        clientName: user.businessName,
        contact: user.whatsapp || user.email,
      });

      return { user, mode: 'admin_code' };
    }

    reqRecord.attempts = (reqRecord.attempts || 0) + 1;
    if (reqRecord.attempts >= 5) {
      reqRecord.status = 'rejected';
      reqRecord.tokenHash = undefined;
    }
    db.passwordResets[reqRecord.id] = reqRecord;
    saveDb(db);
  }

  throw new Error('Código de recuperação inválido, expirado ou já utilizado.');
}

export function adminSetUserPixLock(
  userId: string,
  locked: boolean
): ClientUser {
  const db = ensureDb();
  const user = db.users?.[userId];
  if (!user) throw new Error('Cliente não encontrado.');
  user.pixLockedUntil = locked
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;
  db.users![user.id] = user;
  saveDb(db);
  return user;
}

export function adminSetUserSuspended(
  userId: string,
  suspended: boolean
): ClientUser {
  const db = ensureDb();
  const user = db.users?.[userId];
  if (!user) throw new Error('Cliente não encontrado.');
  user.isSuspended = suspended;
  if (suspended) {
    user.sessionVersion = (user.sessionVersion ?? 1) + 1;
  }
  db.users![user.id] = user;
  saveDb(db);
  return user;
}

export function getAdminSecurityOverview(): {
  resetRequests: PasswordResetRequest[];
  usersSecurity: Array<{
    id: string;
    name: string;
    businessName: string;
    email: string;
    whatsapp: string;
    lastPasswordResetAt?: string;
    pixLockedUntil?: string | null;
    isPixLocked: boolean;
    isSuspended: boolean;
    hasBackupCode: boolean;
    stores: Array<{ slug: string; storeCode: string; title: string; pixKey: string }>;
  }>;
} {
  const db = ensureDb();
  const nowMs = Date.now();
  let modified = false;

  const resetRequests = Object.values(db.passwordResets || {})
    .map((r) => {
      if (
        (r.status === 'pending_admin' || r.status === 'approved_ready') &&
        nowMs > new Date(r.expiresAt).getTime()
      ) {
        r.status = 'expired';
        r.tokenHash = undefined;
        modified = true;
      }
      return r;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (modified) saveDb(db);

  const usersSecurity = Object.values(db.users || {})
    .filter((u) => Boolean(u.passwordHash))
    .map((u) => {
      const qrs = getDynamicQRsByOwner(u.id, u.email).filter(
        (q) => q.slug !== 'demo-restaurante' && q.slug !== 'demo-catalogo'
      );
      return {
        id: u.id,
        name: u.name,
        businessName: u.businessName,
        email: u.email,
        whatsapp: u.whatsapp,
        lastPasswordResetAt: u.lastPasswordResetAt,
        pixLockedUntil: u.pixLockedUntil || null,
        isPixLocked: isTimestampActiveFuture(u.pixLockedUntil),
        isSuspended: Boolean(u.isSuspended),
        hasBackupCode: Boolean(u.recoveryCodeHash),
        stores: qrs.map((q) => ({
          slug: q.slug,
          storeCode: q.storeCode || computeStableStoreCode({ id: q.id, slug: q.slug, storeCode: q.storeCode }),
          title: q.title || q.slug,
          pixKey: db.menus[q.slug]?.pixKey || q.qrConfig?.pixKey || '',
        })),
      };
    })
    .sort((a, b) => {
      if (a.isSuspended !== b.isSuspended) return a.isSuspended ? -1 : 1;
      if (a.isPixLocked !== b.isPixLocked) return a.isPixLocked ? -1 : 1;
      return a.businessName.localeCompare(b.businessName, 'pt-BR');
    });

  return { resetRequests, usersSecurity };
}

// ==========================================
// STORE ORDERS & REAL-TIME STOCK INVENTORY
// ==========================================

export interface CreateOrderParams {
  slug: string;
  customerName: string;
  customerPhone?: string;
  orderMode?: 'table' | 'delivery' | 'pickup' | 'direct';
  tableNumber?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  items: { id: string; quantity: number }[];
  deliveryFee?: number;
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  error?: string;
  order?: StoreOrder;
  updatedItems?: MenuItem[];
}

export async function createStoreOrder(
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  await syncDbFromCloud();
  const db = ensureDb();
  const slug = String(params.slug || '').trim();
  if (!slug) {
    return { success: false, error: 'Identificador da loja não informado.' };
  }

  await syncMenuFromCloud(slug);
  const menu = db.menus[slug];
  if (!menu) {
    return { success: false, error: 'Catálogo ou cardápio não encontrado.' };
  }

  if (!Array.isArray(params.items) || params.items.length === 0) {
    return { success: false, error: 'Seu carrinho está vazio.' };
  }

  // 1. Pre-validate stock for limited and unique items
  for (const reqItem of params.items) {
    const target = menu.items.find((i) => i.id === reqItem.id);
    if (!target) continue;
    const reqQty = Math.max(1, Math.floor(reqItem.quantity || 1));
    const stockInfo = getItemStockInfo(target);

    if (stockInfo.stockMode === 'unique') {
      if (
        !target.isAvailable ||
        (typeof target.stockQuantity === 'number' && target.stockQuantity <= 0)
      ) {
        return {
          success: false,
          error: `A peça única "${target.name}" acabou de ser reservada ou esgotou. Atualize seu pedido.`,
        };
      }
    } else if (stockInfo.stockMode === 'limited') {
      const currentStock =
        typeof target.stockQuantity === 'number' ? target.stockQuantity : 0;
      if (currentStock <= 0 || !target.isAvailable) {
        return {
          success: false,
          error: `O produto "${target.name}" acabou de esgotar.`,
        };
      }
      if (currentStock < reqQty) {
        return {
          success: false,
          error: `Restam apenas ${currentStock} unidade(s) de "${target.name}". Ajuste a quantidade no carrinho.`,
        };
      }
    }
  }

  // 2. Deduct stock and compile order items
  const orderItems: StoreOrderItem[] = [];
  let subtotal = 0;
  let stockChanged = false;

  for (const reqItem of params.items) {
    const target = menu.items.find((i) => i.id === reqItem.id);
    if (!target) continue;
    const reqQty = Math.max(1, Math.floor(reqItem.quantity || 1));
    let stockDeducted = 0;

    if (target.stockMode === 'unique') {
      stockDeducted = 1;
      target.stockQuantity = 0;
      target.isAvailable = false; // Announcement immediately leaves storefront / marked out of stock
      stockChanged = true;
    } else if (target.stockMode === 'limited') {
      const currentStock =
        typeof target.stockQuantity === 'number' ? target.stockQuantity : 0;
      stockDeducted = Math.min(currentStock, reqQty);
      const newStock = Math.max(0, currentStock - reqQty);
      target.stockQuantity = newStock;
      if (newStock === 0) {
        target.isAvailable = false; // Announcement immediately leaves storefront / marked out of stock
      }
      stockChanged = true;
    }

    const itemPrice = typeof target.price === 'number' ? target.price : 0;
    subtotal += itemPrice * reqQty;

    orderItems.push({
      id: target.id,
      name: target.name,
      price: itemPrice,
      quantity: reqQty,
      stockMode: target.stockMode || 'unlimited',
      stockDeducted,
    });
  }

  if (stockChanged) {
    menu.updatedAt = new Date().toISOString();
    saveMenu(menu);
    await persistMenuToCloud(menu);
  }

  const orderId = `PED-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();
  const rawDeliveryFee =
    typeof params.deliveryFee === 'number' && params.deliveryFee >= 0
      ? params.deliveryFee
      : params.orderMode === 'delivery' && menu.deliveryFee
      ? menu.deliveryFee
      : 0;
  const deliveryFee = Number(rawDeliveryFee.toFixed(2));
  const total = Number((subtotal + deliveryFee).toFixed(2));

  const order: StoreOrder = {
    id: orderId,
    slug: menu.slug,
    storeTitle: menu.title,
    storeOwnerId: menu.ownerId,
    storeOwnerEmail: menu.ownerEmail,
    customerName: String(params.customerName || '').trim() || 'Cliente WhatsApp',
    customerPhone: params.customerPhone ? String(params.customerPhone).trim() : undefined,
    orderMode: params.orderMode || 'direct',
    tableNumber: params.tableNumber ? String(params.tableNumber).trim() : undefined,
    deliveryAddress: params.deliveryAddress
      ? String(params.deliveryAddress).trim()
      : undefined,
    paymentMethod:
      String(params.paymentMethod || '').trim() || 'A combinar pelo WhatsApp',
    items: orderItems,
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee,
    total,
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
    notes: params.notes ? String(params.notes).trim() : undefined,
  };

  db.orders = db.orders || {};
  db.orders[orderId] = order;
  saveDb(db);
  await persistSliceToCloud('orders');

  sendExternalMobilePush(
    `📦 Novo Pedido #${orderId} - ${menu.title}`,
    `${order.customerName} fechou um pedido de R$ ${total.toFixed(2)} (${orderItems.length} itens).`,
    'package,shopping_bags'
  );

  return {
    success: true,
    order,
    updatedItems: menu.items,
  };
}

export async function confirmStoreOrder(params: {
  orderId: string;
  user?: ClientUser | null;
  isAdmin?: boolean;
}): Promise<{ success: boolean; error?: string; order?: StoreOrder }> {
  await syncDbFromCloud();
  const db = ensureDb();
  db.orders = db.orders || {};
  const order = db.orders[params.orderId];
  if (!order) {
    return { success: false, error: 'Pedido não encontrado.' };
  }

  if (!params.isAdmin && params.user) {
    const isOwner =
      order.storeOwnerId === params.user.id ||
      order.storeOwnerEmail?.toLowerCase() === params.user.email?.toLowerCase();
    const isStoreOwnerInMenu =
      db.menus[order.slug]?.ownerId === params.user.id ||
      db.menus[order.slug]?.ownerEmail?.toLowerCase() ===
        params.user.email?.toLowerCase();
    const isMasterAdmin =
      params.user.email?.toLowerCase() ===
      (process.env.ADMIN_USERNAME || 'spotqr-admin').toLowerCase();
    if (!isOwner && !isStoreOwnerInMenu && !isMasterAdmin) {
      return {
        success: false,
        error: 'Você não tem permissão para confirmar este pedido.',
      };
    }
  }

  order.status = 'confirmed';
  order.confirmedAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  saveDb(db);
  await persistSliceToCloud('orders');

  return { success: true, order };
}

export async function cancelStoreOrder(params: {
  orderId: string;
  user?: ClientUser | null;
  isAdmin?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  order?: StoreOrder;
  updatedItems?: MenuItem[];
}> {
  await syncDbFromCloud();
  const db = ensureDb();
  db.orders = db.orders || {};
  const order = db.orders[params.orderId];
  if (!order) {
    return { success: false, error: 'Pedido não encontrado.' };
  }

  if (!params.isAdmin && params.user) {
    const isOwner =
      order.storeOwnerId === params.user.id ||
      order.storeOwnerEmail?.toLowerCase() === params.user.email?.toLowerCase();
    const isStoreOwnerInMenu =
      db.menus[order.slug]?.ownerId === params.user.id ||
      db.menus[order.slug]?.ownerEmail?.toLowerCase() ===
        params.user.email?.toLowerCase();
    const isMasterAdmin =
      params.user.email?.toLowerCase() ===
      (process.env.ADMIN_USERNAME || 'spotqr-admin').toLowerCase();
    if (!isOwner && !isStoreOwnerInMenu && !isMasterAdmin) {
      return {
        success: false,
        error: 'Você não tem permissão para cancelar este pedido.',
      };
    }
  }

  if (order.status === 'cancelled') {
    return { success: true, order };
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  // Restore inventory and put product back on air
  let updatedItems: MenuItem[] | undefined;
  await syncMenuFromCloud(order.slug);
  const menu = db.menus[order.slug];
  if (menu) {
    let stockRestored = false;
    for (const ordItem of order.items) {
      if (
        typeof ordItem.stockDeducted === 'number' &&
        ordItem.stockDeducted > 0
      ) {
        const target = menu.items.find((i) => i.id === ordItem.id);
        if (target) {
          if (target.stockMode === 'unique') {
            target.stockQuantity = 1;
            target.isAvailable = true; // Returns to air!
            stockRestored = true;
          } else if (target.stockMode === 'limited') {
            const currentStock =
              typeof target.stockQuantity === 'number'
                ? target.stockQuantity
                : 0;
            target.stockQuantity = currentStock + ordItem.stockDeducted;
            if (target.stockQuantity > 0) {
              target.isAvailable = true; // Returns to air!
            }
            stockRestored = true;
          }
        }
      }
    }

    if (stockRestored) {
      menu.updatedAt = new Date().toISOString();
      saveMenu(menu);
      await persistMenuToCloud(menu);
      updatedItems = menu.items;
    }
  }

  saveDb(db);
  await persistSliceToCloud('orders');

  return { success: true, order, updatedItems };
}

export async function getStoreOrders(
  slug: string,
  user?: ClientUser | null,
  isAdmin?: boolean
): Promise<{
  success: boolean;
  error?: string;
  orders: StoreOrder[];
  pendingCount: number;
}> {
  await syncDbFromCloud();
  const db = ensureDb();
  db.orders = db.orders || {};

  const cleanSlug = String(slug || '').trim();
  const allOrders = Object.values(db.orders).filter(
    (o) => o.slug === cleanSlug
  );

  if (!isAdmin && user && allOrders.length > 0) {
    const first = allOrders[0];
    const isOwner =
      first.storeOwnerId === user.id ||
      first.storeOwnerEmail?.toLowerCase() === user.email?.toLowerCase();
    const isStoreOwnerInMenu =
      db.menus[cleanSlug]?.ownerId === user.id ||
      db.menus[cleanSlug]?.ownerEmail?.toLowerCase() ===
        user.email?.toLowerCase();
    const isAdmin =
      user.email?.toLowerCase() ===
      (process.env.ADMIN_USERNAME || 'spotqr-admin').toLowerCase();
    if (!isOwner && !isStoreOwnerInMenu && !isAdmin) {
      return {
        success: false,
        error: 'Acesso negado aos pedidos desta loja.',
        orders: [],
        pendingCount: 0,
      };
    }
  }

  const sorted = allOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const pendingCount = sorted.filter((o) => o.status === 'pending').length;

  return { success: true, orders: sorted, pendingCount };
}

export async function getUserOrdersOverview(
  user: ClientUser
): Promise<Record<string, { total: number; pending: number }>> {
  await syncDbFromCloud();
  const db = ensureDb();
  db.orders = db.orders || {};

  const result: Record<string, { total: number; pending: number }> = {};
  const userStores = getDynamicQRsByOwner(user.id, user.email);
  const userSlugs = new Set(userStores.map((s) => s.slug));

  for (const o of Object.values(db.orders)) {
    if (
      userSlugs.has(o.slug) ||
      o.storeOwnerId === user.id ||
      o.storeOwnerEmail?.toLowerCase() === user.email?.toLowerCase()
    ) {
      if (!result[o.slug]) {
        result[o.slug] = { total: 0, pending: 0 };
      }
      result[o.slug].total += 1;
      if (o.status === 'pending') {
        result[o.slug].pending += 1;
      }
    }
  }

  return result;
}



