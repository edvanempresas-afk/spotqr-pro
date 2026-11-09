import { NextRequest, NextResponse } from 'next/server';
import {
  getMenuBySlug,
  saveMenu,
  getDynamicQRBySlug,
  saveDynamicQR,
} from '@/lib/db';
import { RestaurantMenu, DynamicQRRecord } from '@/lib/types';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 });
  }

  const menu = getMenuBySlug(slug);
  if (!menu) {
    return NextResponse.json(
      { error: 'Cardápio não encontrado' },
      { status: 404 }
    );
  }

  const qr = getDynamicQRBySlug(slug);
  const isPaid = Boolean(qr?.isPaid || slug === 'demo-restaurante');

  return NextResponse.json({
    ...menu,
    isPaid,
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientUser = getAuthenticatedClientUser(request);
    const isAdmin = isAdminRequestAuthenticated(request);

    if (!clientUser && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Faça login ou cadastre sua conta de cliente para salvar alterações no cardápio.',
        },
        { status: 401 }
      );
    }

    const body: RestaurantMenu = await request.json();

    if (!body.slug || !body.title) {
      return NextResponse.json(
        { error: 'Título e slug são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanSlug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    const updatedMenu: RestaurantMenu = {
      ...body,
      slug: cleanSlug,
      ownerId: clientUser?.id || body.ownerId,
      ownerEmail: clientUser?.email || body.ownerEmail,
      updatedAt: new Date().toISOString(),
    };

    saveMenu(updatedMenu);

    // Ensure a corresponding DynamicQRRecord exists and is linked to this client!
    const existingQR = getDynamicQRBySlug(cleanSlug);
    const qrRecord: DynamicQRRecord = {
      id: existingQR?.id || `qr_${Date.now()}`,
      slug: cleanSlug,
      title: body.title,
      targetUrl: existingQR?.targetUrl || `/cardapio/${cleanSlug}`,
      type: 'menu',
      createdAt: existingQR?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: existingQR?.scansCount || 0,
      isPaid: existingQR?.isPaid || false,
      linkedMenuId: cleanSlug,
      ownerId: clientUser?.id || existingQR?.ownerId,
      ownerEmail: clientUser?.email || existingQR?.ownerEmail,
      qrConfig: existingQR?.qrConfig || {
        fgColor: '#0f172a',
        bgColor: '#ffffff',
        cornerColor: body.themeColor || '#16a34a',
        dotStyle: 'rounded',
        frameStyle: 'table_tent',
        frameText: 'CARDÁPIO NA MESA',
        frameColor: body.themeColor || '#16a34a',
        frameTextColor: '#ffffff',
      },
    };
    saveDynamicQR(qrRecord);

    return NextResponse.json({ success: true, menu: updatedMenu });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar cardápio' },
      { status: 500 }
    );
  }
}
