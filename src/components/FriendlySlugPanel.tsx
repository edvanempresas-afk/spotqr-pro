'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Link2,
  X,
} from 'lucide-react';
import { normalizeFriendlySlug } from '@/lib/slugs';

interface FriendlySlugPanelProps {
  currentSlug: string;
  originalSlug?: string;
  storeTitle: string;
  mode: 'menu' | 'catalog';
  onUpdated: (newSlug: string) => void;
  onClose: () => void;
}

export default function FriendlySlugPanel({
  currentSlug,
  originalSlug,
  storeTitle,
  mode,
  onUpdated,
  onClose,
}: FriendlySlugPanelProps) {
  const pathPrefix = mode === 'catalog' ? '/catalogo/' : '/cardapio/';
  const [candidate, setCandidate] = useState(currentSlug);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    normalized: string;
    reason?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initial load for 3 friendly suggestions
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/dynamic-qr/friendly-slug?slug=${encodeURIComponent(
        currentSlug
      )}&title=${encodeURIComponent(storeTitle)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [currentSlug, storeTitle]);

  // Debounced availability check while user types custom link
  useEffect(() => {
    const normalized = normalizeFriendlySlug(candidate);
    if (!normalized) {
      setAvailability({
        available: false,
        normalized: '',
        reason: 'Digite um nome amigável com pelo menos 3 letras.',
      });
      return;
    }

    if (normalized === currentSlug) {
      setAvailability({ available: true, normalized });
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dynamic-qr/friendly-slug?slug=${encodeURIComponent(
            currentSlug
          )}&candidate=${encodeURIComponent(
            normalized
          )}&title=${encodeURIComponent(storeTitle)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.check) setAvailability(data.check);
          if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
        }
      } catch {
        // Ignore transient network issue
      } finally {
        setChecking(false);
      }
    }, 240);

    return () => clearTimeout(timer);
  }, [candidate, currentSlug, storeTitle]);

  const isRedBlocked =
    !checking && availability !== null && !availability.available;
  const isGreenValid =
    !checking &&
    availability !== null &&
    availability.available &&
    availability.normalized !== currentSlug;

  const handleConfirm = async () => {
    const targetSlug = normalizeFriendlySlug(candidate);
    if (!targetSlug || targetSlug === currentSlug || isRedBlocked) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/dynamic-qr/friendly-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSlug,
          newSlug: targetSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Não foi possível alterar o link.');
        setAvailability({
          available: false,
          normalized: targetSlug,
          reason: data.error || 'Este link já está em uso.',
        });
        return;
      }
      onUpdated(data.qr?.slug || targetSlug);
    } catch {
      setSaveError('Erro de conexão ao salvar seu link amigável.');
    } finally {
      setSaving(false);
    }
  };

  const originPreview =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://www.spotqr.com.br';

  return (
    <div className="mt-4 pt-4 border-t border-emerald-500/25 bg-slate-900/85 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Você é PRO! Personalize seu Link Amigável</span>
          </div>
          <p className="text-xs text-slate-300">
            Seu link agora tem a possibilidade de ficar muito mais curto e
            confortável para os clientes digitarem e compartilharem.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Fechar editor de link amigável"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Friendly URL Input */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-300 block">
          Escolha seu endereço personalizado (livre escolha, desde que disponível):
        </label>
        <div
          className={`flex flex-col sm:flex-row sm:items-center rounded-xl border-2 transition overflow-hidden ${
            isRedBlocked
              ? 'border-red-500 bg-red-950/35 ring-2 ring-red-500/30'
              : isGreenValid
              ? 'border-emerald-500 bg-emerald-950/25 ring-2 ring-emerald-500/25'
              : 'border-slate-700 bg-slate-950'
          }`}
        >
          <span className="px-3 py-2 text-[11px] font-mono text-slate-400 bg-slate-900/90 border-b sm:border-b-0 sm:border-r border-slate-800 whitespace-nowrap truncate">
            {originPreview}
            {pathPrefix}
          </span>
          <div className="flex-1 flex items-center pr-2.5">
            <input
              type="text"
              value={candidate}
              onChange={(e) => {
                setSaveError(null);
                setCandidate(
                  e.target.value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                );
              }}
              placeholder="sua-loja-aqui"
              className={`w-full bg-transparent px-3 py-2 text-xs font-mono font-bold outline-none ${
                isRedBlocked ? 'text-red-200' : 'text-white'
              }`}
            />
            {checking && (
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
            )}
            {isRedBlocked && (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            {isGreenValid && (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Status Message */}
        {isRedBlocked && (
          <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              {availability?.reason ||
                'Esse link já está sendo usado por outro usuário. Escolha outro ou clique em uma das 3 melhores opções abaixo.'}
            </span>
          </div>
        )}

        {isGreenValid && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-200 flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Link disponível! Vai ficar:{' '}
              <strong className="font-mono">
                {pathPrefix}
                {availability?.normalized}
              </strong>
            </span>
          </div>
        )}

        {saveError && (
          <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 font-semibold">
            ⚠️ {saveError}
          </div>
        )}
      </div>

      {/* 3 Smart Available Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            3 Melhores Opções Amigáveis Disponíveis (clique para usar):
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((opt) => {
              const selected = normalizeFriendlySlug(candidate) === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSaveError(null);
                    setCandidate(opt);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                    selected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <Link2 className="w-3 h-3 shrink-0" />
                  <span>
                    {pathPrefix}
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-[10px] text-slate-400 leading-relaxed max-w-xl">
          Caso você não renove seu Plano PRO ao final do período, seu endereço
          volta automaticamente para o link anterior (
          <span className="font-mono text-slate-300">
            {pathPrefix}
            {originalSlug || currentSlug}
          </span>
          ).
        </p>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || checking || isRedBlocked || !isGreenValid}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs uppercase tracking-wider transition shadow-glow whitespace-nowrap shrink-0"
        >
          {saving ? 'Aplicando Link...' : 'Salvar Link Amigável'}
        </button>
      </div>
    </div>
  );
}

