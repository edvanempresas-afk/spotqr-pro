import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDeveloperLeads,
  createDeveloperLead,
  updateDeveloperLead,
  deleteDeveloperLead,
  getDeveloperSettings,
  saveDeveloperSettings,
  getAllDynamicQRs,
  getAllDeveloperNotifications,
  markAllDeveloperNotificationsRead,
  createDeveloperNotification,
  getSubscriptionAnalytics,
} from '@/lib/db';
import { DeveloperServiceType } from '@/lib/types';
import { isAdminRequestAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito. Faça login como desenvolvedor.' },
        { status: 401 }
      );
    }

    const leads = getAllDeveloperLeads();
    const settings = getDeveloperSettings();
    const qrs = getAllDynamicQRs();
    const notifications = getAllDeveloperNotifications();
    const subscriptionAnalytics = getSubscriptionAnalytics();

    const paidQRs = qrs.filter((q) => q.isPaid).length;
    const totalScans = qrs.reduce((acc, q) => acc + (q.scansCount || 0), 0);

    // Strip password before returning settings to client
    const safeSettings = {
      ...settings,
      adminPassword: '',
    };

    return NextResponse.json({
      leads,
      settings: safeSettings,
      notifications,
      subscriptionAnalytics,
      platformStats: {
        totalQRs: qrs.length,
        paidQRs,
        qrRevenue: paidQRs * 10.9,
        totalScans,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/developer-leads:', err);
    return NextResponse.json(
      { error: 'Erro ao carregar mensagens do desenvolvedor.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      businessName,
      contact,
      serviceType,
      serviceLabel,
      budgetRange,
      urgency,
      description,
    } = body;

    if (!name || !contact || !description) {
      return NextResponse.json(
        {
          error:
            'Por favor, preencha seu nome, contato (WhatsApp/E-mail) e o que deseja desenvolver.',
        },
        { status: 400 }
      );
    }

    const newLead = createDeveloperLead({
      name: String(name).trim(),
      businessName: businessName ? String(businessName).trim() : '',
      contact: String(contact).trim(),
      serviceType: (serviceType as DeveloperServiceType) || 'sistema_sob_medida',
      serviceLabel: serviceLabel || 'Sistema ou Site Sob Medida',
      budgetRange: budgetRange || 'A combinar',
      urgency: urgency || 'Neste mês',
      description: String(description).trim(),
      estimatedValue: 0,
      developerNotes: '',
    });

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (err) {
    console.error('Error in POST /api/developer-leads:', err);
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem para o desenvolvedor.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (body.action === 'update_settings') {
      const updatedSettings = saveDeveloperSettings(body.settings || {});
      return NextResponse.json({ success: true, settings: updatedSettings });
    }

    if (body.action === 'mark_notifications_read') {
      markAllDeveloperNotificationsRead();
      return NextResponse.json({
        success: true,
        notifications: getAllDeveloperNotifications(),
      });
    }

    if (body.action === 'test_notification') {
      const testNotif = createDeveloperNotification({
        type: 'subscription_paid',
        title: '💰 Teste de Alerta Mobile (+ R$ 10,90)',
        message:
          'Notificações do seu App SpotQR Dev estão ativas e funcionando em tempo real no seu celular!',
        amount: 10.9,
        clientName: 'Teste Desenvolvedor Edvan',
        slug: 'demo-restaurante',
      });
      return NextResponse.json({
        success: true,
        notification: testNotif,
        notifications: getAllDeveloperNotifications(),
      });
    }

    const { id, status, estimatedValue, developerNotes } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'ID da mensagem é obrigatório.' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (estimatedValue !== undefined)
      updates.estimatedValue = Number(estimatedValue) || 0;
    if (developerNotes !== undefined) updates.developerNotes = developerNotes;

    const updated = updateDeveloperLead(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    console.error('Error in PUT /api/developer-leads:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar registro.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!isAdminRequestAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Acesso restrito ao desenvolvedor.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão.' },
        { status: 400 }
      );
    }
    const deleted = deleteDeveloperLead(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error('Error in DELETE /api/developer-leads:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir mensagem.' },
      { status: 500 }
    );
  }
}
