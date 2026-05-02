'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { fetchAccount } from '../lib/bulk-client';

import { useBulkAccount } from '../hooks/useBulkAccount';

export function AccountUpdater() {
  const { publicKey } = useWallet();
  useBulkAccount(publicKey?.toBase58());

  return null;
}
