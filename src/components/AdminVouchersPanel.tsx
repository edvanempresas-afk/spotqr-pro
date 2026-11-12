'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  Ticket,
  Printer,
  Copy,
  Check,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { ProVoucher } from '@/lib/types';

interface AdminVouchersPanelProps {
  vouchers: ProVoucher[];
  onVouchersUpdated: (vouchers: ProVoucher[]) => void;
}

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AdminVouchersPanel({
  vouchers,
  onVouchersUpdated,
}: AdminVouchersPanelProps) {
  const [days, setDays] = useState<number>(7);
  const [recipientHint, setRecipientHint] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days,
          recipientHint: recipientHint.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data?.error || 'Erro ao criar voucher.',
        });
        return;
      }

      if (Array.isArray(data.vouchers)) {
        onVouchersUpdated(data.vouchers);
      }
      setRecipientHint('');
      setFeedback({
        type: 'success',
        text: `🎟️ Voucher ${data.voucher.code} gerado para ${data.voucher.days} ${
          data.voucher.days === 1 ? 'dia' : 'dias'
        } de Plano PRO! Clique em "Imprimir Voucher" para entregar ao cliente.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de conexão ao gerar voucher.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/vouchers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.vouchers)) {
        onVouchersUpdated(data.vouchers);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyCode = (voucher: ProVoucher) => {
    navigator.clipboard.writeText(voucher.code);
    setCopiedId(voucher.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintVoucher = async (voucher: ProVoucher) => {
    setPrintingId(voucher.id);
    const printWin = window.open('', '_blank', 'width=720,height=820');
    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://spotqr.pro';
      const targetUrl = `${origin}/dashboard`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });

      const daysLabel = `${voucher.days} ${
        voucher.days === 1 ? 'DIA' : 'DIAS'
      }`;
      const hintBlock = voucher.recipientHint
        ? `<div class="recipient">Emitido para: <strong>${escapeHtml(
            voucher.recipientHint
          )}</strong></div>`
        : '';

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Voucher SpotQR PRO - ${escapeHtml(voucher.code)}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
    body { margin: 0; padding: 28px; background: #f8fafc; color: #0f172a; display: flex; justify-content: center; }
    .ticket {
      width: 100%;
      max-width: 540px;
      background: #ffffff;
      border: 3px dashed #10b981;
      border-radius: 22px;
      padding: 28px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .brand span { color: #10b981; }
    .badge { background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .title { font-size: 20px; font-weight: 800; margin: 0 0 6px; text-align: center; }
    .subtitle { font-size: 13px; color: #475569; margin: 0 0 18px; text-align: center; line-height: 1.45; }
    .recipient { text-align: center; font-size: 13px; color: #334155; margin-bottom: 14px; }
    .code-box {
      background: #0f172a;
      color: #ffffff;
      border-radius: 16px;
      padding: 18px 16px;
      text-align: center;
      margin-bottom: 18px;
    }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; font-weight: 800; margin-bottom: 6px; }
    .code-value { font-family: 'Courier New', monospace; font-size: 30px; font-weight: 900; letter-spacing: 2px; color: #34d399; }
    .duration { margin-top: 6px; font-size: 12px; font-weight: 700; color: #e2e8f0; }
    .steps { display: flex; align-items: center; gap: 16px; background: #f1f5f9; border-radius: 14px; padding: 14px; }
    .steps ol { margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.55; }
    .qr { width: 110px; height: 110px; border-radius: 10px; background: #fff; padding: 4px; border: 1px solid #cbd5e1; shrink: 0; }
    .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #64748b; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .ticket { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">Spot<span>QR</span> PRO</div>
      <div class="badge">Vale-Teste VIP • ${daysLabel}</div>
    </div>
    <h1 class="title">Acesso Liberado ao Plano PRO</h1>
    <p class="subtitle">
      Experimente seu Cardápio ou Catálogo Digital 100% sem anúncios, com a sua logomarca no centro dos QR Codes e PIX com sua logo.
    </p>
    ${hintBlock}
    <div class="code-box">
      <div class="code-label">Seu Código de Ativação</div>
      <div class="code-value">${escapeHtml(voucher.code)}</div>
      <div class="duration">Válido por ${daysLabel} de acesso PRO após o resgate</div>
    </div>
    <div class="steps">
      <img class="qr" src="${qrDataUrl}" alt="QR Code SpotQR" />
      <ol>
        <li>Aponte a câmera para o QR Code ou acesse <strong>${escapeHtml(
          targetUrl
        )}</strong>.</li>
        <li>Entre ou crie sua conta grátis em <strong>Meus Catálogos &amp; QRs</strong> (ou na tela <strong>Vantagens PRO</strong>).</li>
        <li>No campo <strong>&ldquo;Digite o seu código aqui&rdquo;</strong>, informe o código acima e clique em <strong>Liberar PRO</strong>.</li>
      </ol>
    </div>
    <div class="footer">
      Uso único • Após o término dos ${daysLabel.toLowerCase()}, a conta retorna automaticamente para o plano gratuito sem cobranças surpresas.
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); };
  </script>
</body>
</html>`;

      if (printWin) {
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
      } else {
        setFeedback({
          type: 'error',
          text: 'Permita pop-ups no navegador para abrir a tela de impressão do voucher.',
        });
      }
    } finally {
      setPrintingId(null);
    }
  };

  const buildWhatsAppVoucherUrl = (voucher: ProVoucher) => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://spotqr.pro';
    const msg = encodeURIComponent(
      `Olá${
        voucher.recipientHint ? ` ${voucher.recipientHint}` : ''
      }! 🎟️ Aqui está o seu *Voucher SpotQR PRO* válido por *${voucher.days} ${
        voucher.days === 1 ? 'dia' : 'dias'
      }*:\n\n🔑 Código: *${
        voucher.code
      }*\n\nComo ativar:\n1️⃣ Acesse ${origin}/dashboard (ou a aba Planos PRO)\n2️⃣ Entre na sua conta gratuita\n3️⃣ No campo *"Digite o seu código aqui"*, cole o código acima para liberar seu Catálogo/Cardápio sem anúncios e com sua Logo no QR Code!`
    );
    return `https://wa.me/?text=${msg}`;
  };

  const availableCount = vouchers.filter((v) => !v.isRedeemed).length;
  const redeemedCount = vouchers.filter((v) => v.isRedeemed).length;

  return (
    <div className="bg-[#101726] border border-slate-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <span>Gerar & Imprimir Vouchers PRO (Cortesia / Teste)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina quantos dias o cliente terá de Plano PRO, gere o código único
            e imprima o voucher para entregar pessoalmente.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            Disponíveis: {availableCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            Resgatados: {redeemedCount}
          </span>
        </div>
      </div>

      {/* Create Voucher Form */}
      <form
        onSubmit={handleCreateVoucher}
        className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Quantidade de Dias no Plano PRO:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                required
                value={days}
                onChange={(e) =>
                  setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))
                }
                className="w-24 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-sm font-extrabold text-amber-300 text-center outline-none"
              />
              <div className="flex flex-wrap gap-1">
                {[3, 7, 15, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                      days === d
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Cliente / Loja (Opcional — aparece impresso no voucher):
            </label>
            <input
              type="text"
              value={recipientHint}
              onChange={(e) => setRecipientHint(e.target.value)}
              placeholder="Ex: Pizzaria Bom Sabor (Atendimento Presencial)"
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Gerando...' : 'Gerar Voucher PRO'}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}
      </form>

      {/* Vouchers List */}
      {vouchers.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
          Nenhum voucher gerado ainda. Escolha a quantidade de dias acima e
          clique em <strong>Gerar Voucher PRO</strong>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vouchers.map((voucher) => {
            const isExpiredAfterRedeem =
              voucher.isRedeemed &&
              voucher.proExpiresAt &&
              Date.now() >= new Date(voucher.proExpiresAt).getTime();

            return (
              <div
                key={voucher.id}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition ${
                  voucher.isRedeemed
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-gradient-to-br from-[#131d31] to-[#0f1726] border-amber-500/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-amber-300 bg-slate-950 border border-amber-500/35 px-3 py-1 rounded-xl">
                      {voucher.code}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                        {voucher.days} {voucher.days === 1 ? 'DIA PRO' : 'DIAS PRO'}
                      </span>

                      {voucher.isRedeemed ? (
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isExpiredAfterRedeem
                              ? 'bg-slate-800 border-slate-700 text-slate-400'
                              : 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                          }`}
                        >
                          {isExpiredAfterRedeem ? '⌛ EXPIRADO' : '✅ RESGATADO'}
                        </span>
                      ) : (
                        <span className="bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                          🟢 DISPONÍVEL
                        </span>
                      )}
                    </div>
                  </div>

                  {voucher.recipientHint && (
                    <div className="text-xs text-slate-200 font-semibold">
                      Para: {voucher.recipientHint}
                    </div>
                  )}

                  <div
                    className="text-[11px] text-slate-400 space-y-0.5"
                    suppressHydrationWarning
                  >
                    <div>
                      Criado em:{' '}
                      {new Date(voucher.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {voucher.isRedeemed && (
                      <div className="text-sky-300 flex items-center gap-1 flex-wrap">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Usado por{' '}
                          <strong>
                            {voucher.redeemedStoreName ||
                              voucher.redeemedByName ||
                              voucher.redeemedByEmail}
                          </strong>
                          {voucher.redeemedForSlug
                            ? ` (/${voucher.redeemedForSlug})`
                            : ''}
                          {voucher.proExpiresAt
                            ? ` • Expira em ${new Date(
                                voucher.proExpiresAt
                              ).toLocaleDateString('pt-BR')}`
                            : ''}
                        </span>
                      </div>
                    )}
                    {!voucher.isRedeemed && (
                      <div className="text-amber-200/80 flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          Aguardando o cliente digitar no campo &ldquo;Digite o seu
                          código aqui&rdquo;.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    disabled={printingId === voucher.id}
                    onClick={() => handlePrintVoucher(voucher)}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>
                      {printingId === voucher.id
                        ? 'Preparando...'
                        : 'Imprimir Voucher'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(voucher)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                  >
                    {copiedId === voucher.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {!voucher.isRedeemed && (
                    <a
                      href={buildWhatsAppVoucherUrl(voucher)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteVoucher(voucher.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                    title="Excluir Voucher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
