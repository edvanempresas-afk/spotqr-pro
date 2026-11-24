'use client';

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Coins,
  Copy,
  Check,
  MessageCircle,
  Share2,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Eye,
  KeyRound,
  Edit2,
} from 'lucide-react';
import { PixKeyType } from '@/lib/types';

interface ClientAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export default function ClientAffiliateModal({
  isOpen,
  onClose,
  currentUser,
}: ClientAffiliateModalProps) {
  const [loading, setLoading] = useState(true);
  const [savingPix, setSavingPix] = useState(false);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // PIX form state
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<PixKeyType>('email');
  const [isEditingPix, setIsEditingPix] = useState(false);

  // View Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  const fetchAffiliateData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/affiliates', { cache: 'no-store' });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
        if (resData.pixKey) {
          setPixKey(resData.pixKey);
          setPixType(resData.pixType || 'email');
        }
      } else {
        setErrorMsg(resData.error || 'Erro ao carregar dados do programa.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao carregar dados do programa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAffiliateData();
      setSuccessMsg('');
    }
  }, [isOpen]);

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) {
      setErrorMsg('Digite uma chave PIX válida.');
      return;
    }

    setSavingPix(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_pix',
          pixKey: pixKey.trim(),
          pixType,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setData(resData);
        setIsEditingPix(false);
        setSuccessMsg('Chave PIX salva! Seu link de indicação exclusivo foi gerado.');
      } else {
        setErrorMsg(resData.error || 'Erro ao salvar chave PIX.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao salvar chave PIX.');
    } finally {
      setSavingPix(false);
    }
  };

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://spotqr.pro';
  const referralCode = data?.referralCode || currentUser?.referralCode || 'parceiro';
  const referralUrl = `${origin}/?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const whatsappShareText = `Olá parceiro! Estou usando o SpotQR para criar meu cardápio digital e QR Code e o resultado ficou profissional demais. Consegui um Convite VIP com 15% de Desconto para você assinar o Plano PRO por apenas R$ 25,50: ${referralUrl} . Vale muito a pena testar!`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const hasPix = data?.hasPixConfigured && !isEditingPix;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0d131f] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-glow shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <Coins className="w-3 h-3" />
                Programa Oficial Indique & Ganhe
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Ganhe R$ 10,00 no PIX por Amigo Indicado
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Offer Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#101c2e] to-amber-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              A Oferta Perfeita (Win-Win)
            </div>
            <div className="text-sm font-semibold text-white leading-relaxed">
              Seu amigo ganha <strong className="text-emerald-400">15% de Desconto VIP</strong> (Plano PRO de R$ 29,90 por <strong className="text-emerald-300">R$ 25,50</strong>) e você recebe <strong className="text-amber-300">R$ 10,00 limpos no seu PIX</strong>!
            </div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 shrink-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Sua Comissão</div>
            <div className="text-xl font-black text-amber-400">R$ 10,00</div>
            <div className="text-[10px] text-slate-400">por 1ª assinatura paga</div>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: PIX KEY CONFIGURATION (Required to unlock link) */}
        {!hasPix ? (
          <form
            onSubmit={handleSavePix}
            className="p-5 rounded-2xl bg-[#101726] border border-amber-500/40 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-amber-300 font-extrabold text-sm">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Passo 1 de 2: Cadastre sua Chave PIX para Ativar seu Link</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para garantir que seus pagamentos sejam transferidos sem atraso quando seus indicados assinarem, informe onde você deseja receber suas comissões via PIX:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Tipo da Chave:
                </label>
                <select
                  value={pixType}
                  onChange={(e) => setPixType(e.target.value as PixKeyType)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="phone">Celular (com DDD)</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Sua Chave PIX:
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    pixType === 'cpf'
                      ? 'Ex: 123.456.789-00'
                      : pixType === 'phone'
                      ? 'Ex: 11999998888'
                      : pixType === 'email'
                      ? 'Ex: seuemail@gmail.com'
                      : 'Cole sua chave PIX aqui'
                  }
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {isEditingPix && (
                <button
                  type="button"
                  onClick={() => setIsEditingPix(false)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Cancelar edição
                </button>
              )}
              <button
                type="submit"
                disabled={savingPix}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow transition flex items-center gap-2 ml-auto"
              >
                {savingPix ? 'Salvando...' : 'Salvar Chave PIX e Liberar Link VIP'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-[#101726] border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sua Chave PIX para Recebimento ({data?.pixType?.toUpperCase()}):
              </span>
              <div className="font-mono text-emerald-400 font-bold text-xs sm:text-sm">
                {data?.pixKey}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingPix(true)}
              className="py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Alterar Chave PIX</span>
            </button>
          </div>
        )}

        {/* STEP 2: REFERRAL LINK & SHARING (Active when PIX is set) */}
        {hasPix && (
          <div className="p-5 rounded-2xl bg-[#101726] border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                Seu Link Exclusivo de Indicação VIP
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Código: <strong className="text-white">{referralCode}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs select-all"
              />

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* STEP 3: METRICS IN REAL TIME */}
        {hasPix && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Amigos Cadastrados
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {data?.stats?.referredTotal || 0}
              </div>
              <div className="text-[10px] text-slate-500">Plano Grátis</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
              <div className="text-[10px] font-bold uppercase text-emerald-400">
                Assinantes PRO Pagos
              </div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">
                {data?.stats?.referredPaid || 0}
              </div>
              <div className="text-[10px] text-emerald-500 font-semibold">Convertidos</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
              <div className="text-[10px] font-bold uppercase text-amber-400">
                Saldo a Receber (PIX)
              </div>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                R$ {(data?.stats?.pendingBalance || 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-[10px] text-amber-500 font-semibold">Pendente</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Total Já Recebido
              </div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                R$ {(data?.stats?.paidBalance || 0).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-[10px] text-slate-500">Comprovantes OK</div>
            </div>
          </div>
        )}

        {/* STEP 4: TRANSPARENT OFFICIAL RULES */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#101726]/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-white font-extrabold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Regras Transparentes do Programa Indique & Ganhe</span>
          </div>

          <ul className="text-xs space-y-2 text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>1. Cadastro obrigatório pelo link:</strong> Seu amigo precisa criar a conta clicando no seu link exclusivo para ativar o desconto de R$ 25,50 e vincular a comissão a você.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>2. Pagamento confirmado do PRO:</strong> A comissão é gerada apenas quando o indicado <strong>pagar e ativar o Plano PRO</strong>. Cadastros gratuitos não geram comissão.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>3. Bônus de R$ 10,00 na 1ª mensalidade (Não recorrente):</strong> O valor de R$ 10,00 é pago uma única vez por novo assinante PRO conquistado. As renovações dos meses seguintes não geram comissão.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>4. Pagamento via PIX em até 48h após confirmação do robô:</strong> O valor da comissão será pago após a confirmação do pagamento do Plano PRO pelo nosso robô, podendo demorar até 48 horas úteis para ser creditado na sua conta, com o <strong>comprovante bancário anexado</strong> no seu painel para conferência.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>5. Sem auto-indicação:</strong> Não é permitido indicar sua própria conta para obter cashback. O sistema valida dados para garantir indicações reais.
              </span>
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Dúvidas sobre o programa?</span>
            <a
              href="/regras-indique-e-ganhe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
            >
              <span>Ver regulamento oficial completo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* STEP 5: PAYOUTS HISTORY & RECEIPT ARCHIVE (Visible to the affiliate) */}
        {data?.payouts && data.payouts.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Seus Comprovantes de Pagamento PIX Arquivados
              </span>
            </div>

            <div className="space-y-2">
              {data.payouts.map((payout: any) => (
                <div
                  key={payout.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      R$ {payout.totalAmount.toFixed(2).replace('.', ',')} transferido via PIX
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {payout.totalConversions} indicação(ões) • Pago em{' '}
                      {new Date(payout.paidAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveReceipt(payout)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 font-bold transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Comprovante</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* RECEIPT VIEW MODAL FOR AFFILIATE */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#101726] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Comprovante Bancário do seu PIX
                </h3>
                <span className="text-xs text-slate-400">
                  R$ {activeReceipt.totalAmount.toFixed(2).replace('.', ',')} • SpotQR Pro
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-slate-950 p-2 flex items-center justify-center border border-slate-800">
              {activeReceipt.receiptUrl?.startsWith('data:image') ||
              activeReceipt.receiptUrl?.endsWith('.png') ||
              activeReceipt.receiptUrl?.endsWith('.jpg') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeReceipt.receiptUrl}
                  alt="Comprovante PIX"
                  className="max-w-full max-h-[55vh] object-contain rounded-lg"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="text-sm text-slate-300 font-semibold">
                    {activeReceipt.receiptName || 'Comprovante em anexo'}
                  </div>
                  {activeReceipt.receiptUrl && (
                    <a
                      href={activeReceipt.receiptUrl}
                      download={activeReceipt.receiptName || 'comprovante.pdf'}
                      className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold uppercase tracking-wider"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Baixar Comprovante</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="py-2.5 px-5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold"
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
