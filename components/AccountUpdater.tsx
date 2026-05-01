'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { fetchAccount } from '../lib/bulk-client';

export function AccountUpdater() {
  const { connected, publicKey } = useWallet();
  const { setConnected, setSnapshot } = usePortfolioStore();

  useEffect(() => {
    if (connected && publicKey) {
      setConnected(true);
      const pubkey = publicKey.toBase58();
      
      const refresh = () => {
        fetchAccount(pubkey)
          .then(data => setSnapshot(data))
          .catch(err => {
            console.error("Account refresh error:", err);
          });
      };

      refresh();
      const interval = setInterval(refresh, 5000); // 5s refresh for tighter UI
      return () => clearInterval(interval);
    } else {
      setConnected(false);
      setSnapshot(null);
    }
  }, [connected, publicKey, setConnected, setSnapshot]);

  return null;
}
