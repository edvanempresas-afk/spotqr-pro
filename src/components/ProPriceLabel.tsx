'use client';

import React from 'react';
import { useProPrice } from '@/lib/pro-price';

export default function ProPriceLabel() {
  const { proPriceLabel } = useProPrice();
  return <>{proPriceLabel}</>;
}

