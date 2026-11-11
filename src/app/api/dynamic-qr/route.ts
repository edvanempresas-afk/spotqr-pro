import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDynamicQRs,
  getDynamicQRBySlug,
  getDynamicQRsByOwner,
  saveDynamicQR,
  getMenuBySlug,
  syncDbFromCloud,
  persistSliceToCloud,
  persistMenuToCloud,
} from '@/lib/db';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';
import { DynamicQRRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await syncDbFromCloud();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const qr = getDynamicQRBySlug(slug);
    if (!qr) {
      return NextResponse.json(
        { error: 'QR Code não encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(qr);
  }

  const clientUser = getAuthenticatedClientUser(request);
  const isAdmin = isAdminRequestAuthenticated(request);

  if (!clientUser && !isAdmin) {
    return NextResponse.json(
      {
        error:
          'Faça login ou crie sua conta de cliente para acessar seus QR Codes e Cardápios.',
      },
      { status: 401 }
    );
  }

  if (isAdmin && !clientUser) {
    return NextResponse.json(getAllDynamicQRs());
  }

  const userQRs = getDynamicQRsByOwner(clientUser!.id, clientUser!.email);
  return NextResponse.json(userQRs);
}

export async function POST(request: NextRequest) {
  try {
    await syncDbFromCloud();
    const clientUser = getAuthenticatedClientUser(request);
    const isAdmin = isAdminRequestAuthenticated(request);

    if (!clientUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Faça login para salvar seu QR Code ou Cardápio.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, title, targetUrl, type, qrConfig } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug é obrigatório.' },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    const existing = getDynamicQRBySlug(cleanSlug);
    const record: DynamicQRRecord = {
      id: existing?.id || `qr_${Date.now()}`,
      slug: cleanSlug,
      title:
        title ||
        existing?.title ||
        clientUser?.businessName ||
        `Cardápio ${cleanSlug}`,
      targetUrl:
        targetUrl || existing?.targetUrl || `/cardapio/${cleanSlug}`,
      type: type || existing?.type || 'menu',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scansCount: existing?.scansCount || 0,
      isPaid: existing?.isPaid || false,
      qrConfig: qrConfig || existing?.qrConfig || {},
      linkedMenuId: cleanSlug,
      ownerId: clientUser?.id || existing?.ownerId || 'admin',
      ownerEmail: clientUser?.email || existing?.ownerEmail || '',
    };

    saveDynamicQR(record);
    await persistSliceToCloud('qrs');
    if (record.type === 'menu' || record.type === 'catalog') {
      const m = getMenuBySlug(cleanSlug, record.type, record.title);
      if (m) await persistMenuToCloud(m);
    }
    return NextResponse.json({ success: true, qr: record });
  } catch (error) {
    console.error('Error creating/saving QR:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar QR Code.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await syncDbFromCloud();
    const clientUser = getAuthenticatedClientUser(request);
    const isAdmin = isAdminRequestAuthenticated(request);

    if (!clientUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Faça login para editar seu QR Code.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, targetUrl, title, qrConfig } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug é obrigatório' },
        { status: 400 }
      );
    }

    const existing = getDynamicQRBySlug(slug);
    if (!existing) {
      return NextResponse.json(
        { error: 'QR Code não encontrado' },
        { status: 404 }
      );
    }

    const updated: DynamicQRRecord = {
      ...existing,
      targetUrl: targetUrl !== undefined ? targetUrl : existing.targetUrl,
      title: title !== undefined ? title : existing.title,
      qrConfig:
        qrConfig !== undefined
          ? { ...existing.qrConfig, ...qrConfig }
          : existing.qrConfig,
      ownerId: existing.ownerId || clientUser?.id,
      ownerEmail: existing.ownerEmail || clientUser?.email,
      updatedAt: new Date().toISOString(),
    };

    saveDynamicQR(updated);
    await persistSliceToCloud('qrs');

    return NextResponse.json({ success: true, qr: updated });
  } catch (error) {
    console.error('Error updating dynamic QR:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar QR Code' },
      { status: 500 }
    );
  }
}
