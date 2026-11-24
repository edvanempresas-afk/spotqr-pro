'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  Gift,
  Copy,
  Check,
  Upload,
  FileCheck,
  ExternalLink,
  MessageCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Users,
} from 'lucide-react';
import { AffiliatePayout, PixKeyType, ReferralConversion } from '@/lib/types';

interface PendingAffiliateGroup {
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  affiliateWhatsapp: string;
  pixKey: string;
  pixType: PixKeyType;
  conversions: ReferralConversion[];
  totalAmount: number;
  count: number;
}

export default function AdminAffiliatesPanel() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [pendingPayouts, setPendingPayouts] = useState<PendingAffiliateGroup[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<AffiliatePayout[]>([]);
  const [summary, setSummary] = useState({
    totalPendingAmount: 0,
    totalPaidAmount: 0,
    pendingAffiliatesCount: 0,
    totalPayoutsCount: 0,
  });

  // Pay Modal State
  const [selectedGroup, setSelectedGroup] = useState<PendingAffiliateGroup | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [paying, setPaying] = useState(false);

  // View Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<AffiliatePayout | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/affiliates', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setPendingPayouts(data.pendingPayouts || []);
        setPayoutHistory(data.payoutHistory || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setErrorMsg(data.error || 'Erro ao carregar dados de afiliados.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao carregar dados de afiliados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('O arquivo do comprovante deve ter no máximo 8 MB.');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayout = async () => {
    if (!selectedGroup) return;
    if (!receiptBase64) {
      alert('É obrigatório anexar a imagem ou PDF do comprovante do PIX.');
      return;
    }

    setPaying(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_affiliate',
          affiliateId: selectedGroup.affiliateId,
          receiptUrl: receiptBase64,
          receiptName: receiptFileName || 'comprovante_pix.png',
          adminNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(
          `PIX confirmado com sucesso! R$ ${selectedGroup.totalAmount.toFixed(2)} pago para ${selectedGroup.affiliateName}.`
        );
        setSelectedGroup(null);
        setReceiptBase64('');
        setReceiptFileName('');
        setAdminNotes('');
        await loadData();
      } else {
        setErrorMsg(data.error || 'Erro ao registrar pagamento.');
      }
    } catch {
      setErrorMsg('Erro ao registrar pagamento.');
    } finally {
      setPaying(false);
    }
  };

  const cleanPhone = (phone?: string) => (phone || '').replace(/\D/g, '');

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#101726] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Pendente para Pagar (PIX)
            </span>
            <div className="text-2xl font-black text-amber-400">
              R$ {summary.totalPendingAmount.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-xs text-slate-400">
              {summary.pendingAffiliatesCount} parceiro(s) aguardando
            </span>
          </div>
        </div>

        <div className="bg-[#101726] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Total Pago (Histórico)
            </span>
            <div className="text-2xl font-black text-emerald-400">
              R$ {summary.totalPaidAmount.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-xs text-slate-400">
              {summary.totalPayoutsCount} comprovante(s) arquivado(s)
            </span>
          </div>
        </div>

        <div className="bg-[#101726] border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                Regra de Repasse
              </span>
              <div className="text-sm font-bold text-white">R$ 10,00 por PRO</div>
              <span className="text-xs text-slate-400">1º pagamento aprovado</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-glow'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aguardando Pagamento PIX ({pendingPayouts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-glow'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Histórico de Comprovantes Pagos ({payoutHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING PAYOUTS (Zero poluição) */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingPayouts.length === 0 ? (
            <div className="text-center py-14 px-4 bg-[#101726]/60 border border-slate-800 rounded-3xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                Tudo em dia! Nenhuma comissão pendente no momento.
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Quando algum cliente indicado assinar o Plano PRO, o afiliado aparecerá aqui automaticamente com o valor pronto para você transferir via PIX.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayouts.map((group) => {
                const isCopied = copiedKey === group.pixKey;
                return (
                  <div
                    key={group.affiliateId}
                    className="p-5 bg-[#101726] border border-amber-500/30 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition hover:border-amber-500/60"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-white text-base">
                          {group.affiliateName}
                        </span>
                        {group.affiliateWhatsapp && (
                          <a
                            href={`https://wa.me/${cleanPhone(group.affiliateWhatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{group.affiliateWhatsapp}</span>
                          </a>
                        )}
                        <span className="text-xs text-slate-400">
                          ({group.affiliateEmail})
                        </span>
                      </div>

                      {/* PIX Key display with 1-click copy */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-semibold text-slate-400">
                          Chave PIX ({group.pixType.toUpperCase()}):
                        </span>
                        <code className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs select-all">
                          {group.pixKey || 'Não cadastrada'}
                        </code>
                        {group.pixKey && (
                          <button
                            type="button"
                            onClick={() => handleCopyPix(group.pixKey)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 border border-slate-700"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copiada!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Chave</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Conversions breakdown */}
                      <div className="text-xs text-slate-400 pt-1">
                        <strong className="text-slate-200">{group.count} indicado(s) PRO pago(s):</strong>{' '}
                        {group.conversions.map((c) => c.referredUserName || c.referredUserEmail).join(', ')}
                      </div>
                    </div>

                    {/* Amount & Action Button */}
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Valor a Pagar
                        </div>
                        <div className="text-2xl font-black text-amber-400">
                          R$ {group.totalAmount.toFixed(2).replace('.', ',')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroup(group);
                          setReceiptBase64('');
                          setReceiptFileName('');
                          setAdminNotes('');
                        }}
                        className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-glow transition flex items-center gap-2 shrink-0"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Pagar PIX & Anexar Comprovante</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYOUT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {payoutHistory.length === 0 ? (
            <div className="text-center py-14 px-4 bg-[#101726]/60 border border-slate-800 rounded-3xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                Nenhum pagamento registrado no histórico ainda.
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#101726] text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Data</th>
                    <th className="py-3.5 px-4">Afiliado</th>
                    <th className="py-3.5 px-4">Chave PIX</th>
                    <th className="py-3.5 px-4">Qtd Indicações</th>
                    <th className="py-3.5 px-4">Valor Pago</th>
                    <th className="py-3.5 px-4 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0d131f]">
                  {payoutHistory.map((p) => {
                    const formattedDate = new Date(p.paidAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{p.affiliateName}</div>
                          {p.affiliateWhatsapp && (
                            <div className="text-xs text-slate-400">{p.affiliateWhatsapp}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-emerald-400">
                          {p.pixKey}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {p.totalConversions} indicado(s)
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-400">
                          R$ {p.totalAmount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ver Comprovante</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PAY PIX & ATTACH RECEIPT */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#101726] border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Pagar Afiliado via PIX
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedGroup.affiliateName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Valor Total do PIX:</span>
                <span className="text-xl font-black text-emerald-400">
                  R$ {selectedGroup.totalAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">Chave PIX do Afiliado:</div>
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <code className="text-xs font-mono text-emerald-300 break-all select-all">
                    {selectedGroup.pixKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyPix(selectedGroup.pixKey)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copiedKey === selectedGroup.pixKey ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Receipt */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Anexar Comprovante do PIX (Obrigatório) *
              </label>

              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl bg-slate-900/60 transition text-center space-y-2">
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-200">
                    {receiptFileName ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        {receiptFileName}
                      </span>
                    ) : (
                      'Clique para selecionar a imagem do comprovante'
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PNG, JPG ou PDF (máx. 8MB)
                  </div>
                </div>
              </label>

              {/* Receipt Preview */}
              {receiptBase64 && receiptBase64.startsWith('data:image') && (
                <div className="mt-2 max-h-40 overflow-hidden rounded-xl border border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptBase64}
                    alt="Preview comprovante"
                    className="w-full object-contain max-h-40 bg-black/40"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={paying || !receiptBase64}
                onClick={handleConfirmPayout}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pagamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW RECEIPT */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#101726] border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Comprovante PIX: {viewingReceipt.affiliateName}
                </h3>
                <span className="text-xs text-slate-400">
                  R$ {viewingReceipt.totalAmount.toFixed(2).replace('.', ',')} pago em{' '}
                  {new Date(viewingReceipt.paidAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-slate-950 p-2 flex items-center justify-center border border-slate-800">
              {viewingReceipt.receiptUrl?.startsWith('data:image') ||
              viewingReceipt.receiptUrl?.endsWith('.png') ||
              viewingReceipt.receiptUrl?.endsWith('.jpg') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewingReceipt.receiptUrl}
                  alt="Comprovante PIX"
                  className="max-w-full max-h-[55vh] object-contain rounded-lg"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <div className="text-sm text-slate-300 font-semibold">
                    {viewingReceipt.receiptName || 'Comprovante em arquivo anexo'}
                  </div>
                  {viewingReceipt.receiptUrl && (
                    <a
                      href={viewingReceipt.receiptUrl}
                      download={viewingReceipt.receiptName || 'comprovante.pdf'}
                      className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold uppercase tracking-wider"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Baixar Arquivo</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              {viewingReceipt.affiliateWhatsapp && (
                <a
                  href={`https://wa.me/${cleanPhone(
                    viewingReceipt.affiliateWhatsapp
                  )}?text=${encodeURIComponent(
                    `Olá ${viewingReceipt.affiliateName}! Seu pagamento de comissão do SpotQR no valor de R$ ${viewingReceipt.totalAmount.toFixed(
                      2
                    )} referente a ${
                      viewingReceipt.totalConversions
                    } indicação(ões) PRO foi realizado com sucesso!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Confirmação no WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="py-2.5 px-5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold ml-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
