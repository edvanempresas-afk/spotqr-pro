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
} from './types';
import { DEMO_PAYMENTS } from './payments';

interface DatabaseSchema {
  dynamicQRs: Record<string, DynamicQRRecord>;
  menus: Record<string, RestaurantMenu>;
  payments: Record<string, PaymentRecord>;
  developerLeads?: Record<string, DeveloperLead>;
  developerSettings?: DeveloperSettings;
  developerNotifications?: Record<string, DeveloperNotification>;
  users?: Record<string, ClientUser>;
}

export function hashClientPassword(password: string): string {
  return crypto
    .createHmac('sha256', 'spotqr-client-salt-2026')
    .update(password)
    .digest('hex');
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
  | 'leads'
  | 'notifications'
  | 'settings';

const CLOUD_KEYS: CloudSliceKey[] = [
  'users',
  'qrs',
  'payments',
  'leads',
  'notifications',
  'settings',
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
    leads: db.developerLeads || {},
    notifications: db.developerNotifications || {},
    settings: db.developerSettings || initialData.developerSettings,
  };
  await kvRequest(['SET', `spotqr:${slice}`, JSON.stringify(map[slice])]);
}

export async function persistMenuToCloud(menu: RestaurantMenu): Promise<void> {
  if (!menu?.slug || !getCloudKVConfig()) return;
  await kvRequest(['SET', `spotqr:menu:${menu.slug}`, JSON.stringify(menu)]);
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
    db.dynamicQRs[slug].isPaid = true;
    db.dynamicQRs[slug].paymentId = paymentId;
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

  const totalActiveProCount = realCustomerQRs.filter((q) => q.isPaid).length;
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
  const user: ClientUser = {
    id,
    name: input.name.trim(),
    businessName: (input.businessName || input.name).trim(),
    email: cleanEmail,
    whatsapp: (input.whatsapp || '').trim(),
    passwordHash: hashClientPassword(input.passwordPlain),
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

  return user;
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


