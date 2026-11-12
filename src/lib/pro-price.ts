'use client';

import { useEffect, useState } from 'react';

export const DEFAULT_PRO_PRICE = 10.9;

const PRO_PRICE_EVENT = 'spotqr:pro-price-updated';

let cachedProPrice: number | null = null;
let inflightFetch: Promise<number> | null = null;

export function parseProPriceValue(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_PRO_PRICE;
  }
  if (typeof value === 'string') {
    const normalized = parseFloat(value.replace(',', '.').trim());
    return Number.isFinite(normalized) && normalized > 0
      ? normalized
      : DEFAULT_PRO_PRICE;
  }
  return DEFAULT_PRO_PRICE;
}

export function formatBRLNumber(value: number): string {
  const safe = parseProPriceValue(value);
  return safe.toFixed(2).replace('.', ',');
}

export function formatBRL(value: number): string {
  return `R$ ${formatBRLNumber(value)}`;
}

export function broadcastProPriceUpdate(price: unknown): void {
  const safe = parseProPriceValue(price);
  cachedProPrice = safe;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<number>(PRO_PRICE_EVENT, { detail: safe }));
  }
}

async function fetchLiveProPrice(): Promise<number> {
  if (!inflightFetch) {
    inflightFetch = fetch('/api/pro-price', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const price = parseProPriceValue(data?.proPriceReais);
        cachedProPrice = price;
        return price;
      })
      .catch(() => cachedProPrice ?? DEFAULT_PRO_PRICE)
      .finally(() => {
        inflightFetch = null;
      });
  }
  return inflightFetch;
}

export function useProPrice() {
  const [proPrice, setProPrice] = useState<number>(
    () => cachedProPrice ?? DEFAULT_PRO_PRICE
  );

  useEffect(() => {
    let mounted = true;

    fetchLiveProPrice().then((price) => {
      if (mounted) {
        setProPrice(price);
      }
    });

    const onPriceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (mounted && customEvent.detail) {
        setProPrice(parseProPriceValue(customEvent.detail));
      }
    };

    window.addEventListener(PRO_PRICE_EVENT, onPriceUpdated);
    return () => {
      mounted = false;
      window.removeEventListener(PRO_PRICE_EVENT, onPriceUpdated);
    };
  }, []);

  return {
    proPrice,
    proPriceText: formatBRLNumber(proPrice),
    proPriceLabel: formatBRL(proPrice),
  };
}

