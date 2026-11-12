import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClientUser } from '@/lib/client-auth';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';
import {
  cancelStoreOrder,
  confirmStoreOrder,
  createStoreOrder,
  getStoreOrders,
  getUserOrdersOverview,
  syncDbFromCloud,
} from '@/lib/db';
import { checkAndConsumeRateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const user = await getAuthenticatedClientUser(req);
    const isAdmin = isAdminRequestAuthenticated(req);
    if (!user && !isAdmin) {
      return NextResponse.json(
        { error: 'Autenticação necessária para acessar os pedidos.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get('slug') || '').trim();
    const isOverview = searchParams.get('overview') === '1';

    if (isOverview || !slug) {
      if (user) {
        const overview = await getUserOrdersOverview(user);
        return NextResponse.json({ success: true, overview });
      }
      return NextResponse.json({ success: true, overview: {} });
    }

    const result = await getStoreOrders(slug, user, isAdmin);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Acesso negado aos pedidos.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: result.orders,
      pendingCount: result.pendingCount,
    });
  } catch (error) {
    console.error('Error fetching store orders:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar pedidos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncDbFromCloud();
    const body = await req.json();
    const action = String(body.action || 'create').trim();

    // 1. PUBLIC ACTION: Customer placing an order from the showcase
    if (action === 'create') {
      const slug = String(body.slug || '').trim();
      if (!slug) {
        return NextResponse.json(
          { error: 'Identificador do cardápio/catálogo é obrigatório.' },
          { status: 400 }
        );
      }

      // Rate limit per store & ip to prevent checkout spam
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const rateKey = `ord_create:${slug}:${ip}`;
      const rate = checkAndConsumeRateLimit(rateKey, 15, 10 * 60 * 1000);
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error: `Muitas tentativas de pedido seguidas. Aguarde ${Math.ceil(
              rate.retryAfterSeconds / 60
            )} minutos.`,
          },
          { status: 429 }
        );
      }

      const result = await createStoreOrder({
        slug,
        customerName: String(body.customerName || ''),
        customerPhone: body.customerPhone
          ? String(body.customerPhone)
          : undefined,
        orderMode: body.orderMode,
        tableNumber: body.tableNumber ? String(body.tableNumber) : undefined,
        deliveryAddress: body.deliveryAddress
          ? String(body.deliveryAddress)
          : undefined,
        paymentMethod: String(body.paymentMethod || ''),
        items: Array.isArray(body.items) ? body.items : [],
        deliveryFee:
          typeof body.deliveryFee === 'number' ? body.deliveryFee : undefined,
        notes: body.notes ? String(body.notes) : undefined,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Não foi possível registrar o pedido.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: result.order?.id,
        order: result.order,
        updatedItems: result.updatedItems,
      });
    }

    // 2. AUTHENTICATED ACTIONS: Store owner or admin confirming or cancelling/restoring an order
    const user = await getAuthenticatedClientUser(req);
    const isAdmin = isAdminRequestAuthenticated(req);
    if (!user && !isAdmin) {
      return NextResponse.json(
        { error: 'Autenticação necessária para gerenciar pedidos.' },
        { status: 401 }
      );
    }

    const orderId = String(body.orderId || '').trim();
    if (!orderId) {
      return NextResponse.json(
        { error: 'Identificador do pedido (orderId) é obrigatório.' },
        { status: 400 }
      );
    }

    if (action === 'confirm') {
      const result = await confirmStoreOrder({ orderId, user, isAdmin });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Não foi possível confirmar o pedido.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Venda confirmada com sucesso! O estoque foi baixado definitivamente.',
        order: result.order,
      });
    }

    if (action === 'cancel') {
      const result = await cancelStoreOrder({ orderId, user, isAdmin });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Não foi possível cancelar o pedido.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message:
          'Pedido cancelado. As quantidades foram devolvidas ao estoque e o anúncio retornou ao ar imediatamente!',
        order: result.order,
        updatedItems: result.updatedItems,
      });
    }

    return NextResponse.json(
      { error: `Ação inválida: "${action}".` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing store order POST:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar pedido.' },
      { status: 500 }
    );
  }
}

