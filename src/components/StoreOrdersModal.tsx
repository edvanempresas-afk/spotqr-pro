'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  MapPin,
  Utensils,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { StoreOrder, StoreOrderStatus, ShowcaseThemeMode } from '@/lib/types';

interface StoreOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeTitle: string;
  storeMode?: 'menu' | 'catalog';
  themeMode?: ShowcaseThemeMode;
  onOrderUpdated?: () => void;
}

export function StoreOrdersModal({
  isOpen,
  onClose,
  storeSlug,
  storeTitle,
  storeMode = 'catalog',
  themeMode = 'dark',
  onOrderUpdated,
}: StoreOrdersModalProps) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | StoreOrderStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<StoreOrder | null>(null);

  const isLight = themeMode === 'light';

  const fetchOrders = useCallback(async () => {
    if (!storeSlug) return;
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await fetch(
        `/api/cardapio/orders?slug=${encodeURIComponent(storeSlug)}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setActionErrorMsg(data.error || 'Não foi possível carregar os pedidos.');
      }
    } catch {
      setActionErrorMsg('Falha de rede ao buscar pedidos da loja.');
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      setActionSuccessMsg(null);
      setActionErrorMsg(null);
      setOrderToCancel(null);
    }
  }, [isOpen, fetchOrders]);

  if (!isOpen) return null;

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const handleConfirmOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await fetch('/api/cardapio/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', orderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(
          `Pedido #${orderId} confirmado com sucesso! A venda foi registrada e o estoque baixado definitivamente.`
        );
        await fetchOrders();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setActionErrorMsg(data.error || 'Erro ao confirmar pedido.');
      }
    } catch {
      setActionErrorMsg('Erro de conexão ao confirmar pedido.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteCancelOrder = async (order: StoreOrder) => {
    setActionLoadingId(order.id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await fetch('/api/cardapio/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', orderId: order.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(
          `Pedido #${order.id} cancelado com sucesso! As quantidades reservadas voltaram ao estoque e o anúncio retornou imediatamente ao ar no catálogo.`
        );
        setOrderToCancel(null);
        await fetchOrders();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setActionErrorMsg(data.error || 'Erro ao cancelar pedido.');
      }
    } catch {
      setActionErrorMsg('Erro de conexão ao cancelar pedido.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0f172a] border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">
                  Pedidos & Controle de Estoque
                </h2>
                {pendingOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {pendingOrders.length} {pendingOrders.length === 1 ? 'pendente' : 'pendentes'}
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {storeTitle} ({storeMode === 'catalog' ? 'Catálogo' : 'Cardápio'}: /{storeSlug})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              title="Atualizar lista de pedidos"
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar janela"
              className={`p-2 rounded-xl border transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Explanatory Info Card */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isLight
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">
                  Controle Automático Anti-Venda Dupla:
                </strong>{' '}
                Quando um cliente fecha o pedido, o estoque de itens limitados ou
                peças únicas é{' '}
                <span className="font-semibold underline">
                  reduzido na mesma hora
                </span>{' '}
                (se o estoque zerar, o anúncio sai do ar imediatamente para
                outros clientes).
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] opacity-90">
                  <span>
                    ✅ <strong>Confirmar Venda:</strong> use quando o cliente pagar
                    (dá baixa definitiva).
                  </span>
                  <span>
                    ❌ <strong>Cancelar & Devolver ao Estoque:</strong> se o
                    cliente não pagar, o estoque e o anúncio voltam ao ar
                    imediatamente!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {actionSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {actionErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{actionErrorMsg}</span>
              </div>
              <button
                onClick={() => setActionErrorMsg(null)}
                className="text-rose-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-800/60 pb-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                filter === 'all'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Todos os Pedidos ({orders.length})
            </button>

            <button
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                filter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : isLight
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/15'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aguardando Confirmação ({pendingOrders.length})</span>
            </button>

            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                filter === 'confirmed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Vendas Confirmadas ({confirmedOrders.length})</span>
            </button>

            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                filter === 'cancelled'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
                  : isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelados / Devolvidos ({cancelledOrders.length})</span>
            </button>
          </div>

          {/* Orders List */}
          {loading && orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p
                className={`text-xs ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Carregando pedidos e estoque da loja...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div
              className={`py-14 text-center rounded-2xl border ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <Package className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-60" />
              <p className="text-sm font-bold">Nenhum pedido nesta aba</p>
              <p
                className={`text-xs mt-1 max-w-sm mx-auto ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {filter === 'pending'
                  ? 'Nenhum pedido aguardando sua confirmação no momento.'
                  : filter === 'confirmed'
                  ? 'Nenhuma venda confirmada registrada nesta loja ainda.'
                  : filter === 'cancelled'
                  ? 'Nenhum pedido cancelado ou devolvido ao estoque.'
                  : 'Quando os clientes fecharem pedidos pelo catálogo ou cardápio, eles aparecerão aqui.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'pending';
                const isConfirmed = order.status === 'confirmed';
                const isCancelled = order.status === 'cancelled';
                const isActionBusy = actionLoadingId === order.id;

                const hasStockDeducted = order.items.some(
                  (i) => typeof i.stockDeducted === 'number' && i.stockDeducted > 0
                );

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition shadow-sm ${
                      isPending
                        ? isLight
                          ? 'bg-amber-50/50 border-amber-300'
                          : 'bg-[#131d2e] border-amber-500/40'
                        : isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-[#101726] border-slate-800'
                    }`}
                  >
                    {/* Top Row: Order ID, Date & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/50 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 tracking-wide font-mono">
                          #{order.id}
                        </span>
                        <span
                          className={`text-xs ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Aguardando Confirmação</span>
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Venda Confirmada (Pago)</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/35 text-rose-300">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancelado • Estoque Devolvido</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Order Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-3 text-xs border-b border-slate-800/40">
                      <div>
                        <span
                          className={`block text-[10px] font-bold uppercase tracking-wider ${
                            isLight ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Cliente:
                        </span>
                        <span className="font-semibold text-sm">
                          {order.customerName}
                        </span>
                        {order.customerPhone && (
                          <div className="mt-1">
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(
                                /\D/g,
                                ''
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>{order.customerPhone}</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div>
                        <span
                          className={`block text-[10px] font-bold uppercase tracking-wider ${
                            isLight ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Modalidade:
                        </span>
                        <span className="font-semibold">
                          {order.orderMode === 'table'
                            ? `🍽️ ${order.tableNumber || 'Na Mesa'}`
                            : order.orderMode === 'delivery'
                            ? `🛵 Entrega (${order.deliveryAddress || 'Endereço a combinar'})`
                            : order.orderMode === 'pickup'
                            ? '🏪 Retirada na Loja / Balcão'
                            : '🛍️ Pedido Direto'}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`block text-[10px] font-bold uppercase tracking-wider ${
                            isLight ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Forma de Pagamento:
                        </span>
                        <span className="font-semibold">
                          💳 {order.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="py-3 space-y-2">
                      <span
                        className={`block text-[10px] font-bold uppercase tracking-wider ${
                          isLight ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Itens Pedidos & Impacto no Estoque:
                      </span>
                      <div className="space-y-1.5">
                        {order.items.map((it, idx) => (
                          <div
                            key={`${it.id}-${idx}`}
                            className="flex flex-wrap items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400">
                                {it.quantity}x
                              </span>
                              <span className="font-medium">{it.name}</span>
                              {it.stockMode === 'unique' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/35 text-purple-300">
                                  💎 Peça Única {isPending ? '(Reservada)' : isCancelled ? '(Devolvida)' : '(Baixada)'}
                                </span>
                              )}
                              {it.stockMode === 'limited' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/35 text-amber-300">
                                  📦 {it.stockDeducted} unid. {isPending ? 'reservadas' : isCancelled ? 'devolvidas' : 'baixadas'}
                                </span>
                              )}
                            </div>
                            <span className="font-bold">
                              R$ {(it.price * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryFee > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-400">
                          <span>Taxa de Entrega / Envio:</span>
                          <span>+ R$ {order.deliveryFee.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-sm">
                        <span className="font-extrabold">Total do Pedido:</span>
                        <span className="text-base font-black text-emerald-400">
                          R$ {order.total.toFixed(2)}
                        </span>
                      </div>

                      {order.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-xl border border-slate-800/40 mt-1">
                          💬 <strong>Obs do cliente:</strong> {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons for Pending Order */}
                    {isPending && (
                      <div className="pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[11px] text-amber-400/90 leading-tight">
                          {hasStockDeducted
                            ? '⚠️ O estoque destes itens foi reservado. Confirme se foi pago ou cancele para devolver.'
                            : 'Aguardando sua confirmação de pagamento para arquivar o pedido.'}
                        </p>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => setOrderToCancel(order)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/35"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Cancelar e Devolver ao Estoque</span>
                          </button>

                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleConfirmOrder(order.id)}
                            className="px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                          >
                            {isActionBusy ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Confirmar Venda (Pago)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancel & Restore Confirmation Sub-Modal */}
        {orderToCancel && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          >
            <div
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold">
                  Cancelar Pedido #{orderToCancel.id}?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  O cliente <strong>{orderToCancel.customerName}</strong> não
                  realizou o pagamento?
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-slate-300">
                  O que vai acontecer ao cancelar:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>
                    Todas as quantidades reservadas deste pedido voltarão para o
                    estoque.
                  </li>
                  <li>
                    Se o produto estava com estoque zerado e fora do ar,{' '}
                    <strong className="text-emerald-400">
                      o anúncio voltará imediatamente ao ar no catálogo!
                    </strong>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoadingId === orderToCancel.id}
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 transition text-slate-300"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === orderToCancel.id}
                  onClick={() => handleExecuteCancelOrder(orderToCancel)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md flex items-center justify-center gap-1.5"
                >
                  {actionLoadingId === orderToCancel.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Sim, Devolver ao Estoque</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

