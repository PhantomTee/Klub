'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchUserFills } from '../../lib/bulk-client';
import { UserFill } from '../../types';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { connected, publicKey } = useWallet();
  const [fills, setFills] = useState<UserFill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      setLoading(true);
      fetchUserFills(publicKey.toBase58())
        .then(data => setFills(data))
        .catch(err => console.error("History fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [connected, publicKey]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-8 text-[#FFFEEF]">Trade History</h2>
      <div className="p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] min-h-[400px]">
        <table className="w-full text-left text-[11px] font-mono">
          <thead>
            <tr className="text-[#C6B6BA] font-medium border-b border-[#2A2620] uppercase tracking-[0.2em]">
              <th className="py-2">Date</th>
              <th className="py-2">Market</th>
              <th className="py-2">Dir</th>
              <th className="py-2">Size</th>
              <th className="py-2">Fill Px</th>
              <th className="py-2">Fee</th>
              <th className="py-2">OrderId</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-[#736A6C] text-center uppercase tracking-[0.2em] animate-pulse">Fetching records...</td>
              </tr>
            ) : fills.length > 0 ? (
              fills.map((fill, i) => (
                <tr key={i} className="border-b border-[#2A2620]/30 hover:bg-[#FFFEEF]/5 transition-colors">
                  <td className="py-4 text-[#736A6C]">{format(fill.time, 'MM/dd HH:mm:ss')}</td>
                  <td className="py-4 text-[#FFFEEF] font-bold">{fill.symbol}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-[2px] ${fill.isBuy ? 'bg-[#00B481]/10 text-[#00B481]' : 'bg-[#EF4A3C]/10 text-[#EF4A3C]'}`}>
                      {fill.isBuy ? 'BUY' : 'SELL'}
                    </span>
                  </td>
                  <td className="py-4 text-[#C6B6BA]">{fill.size.toFixed(4)}</td>
                  <td className="py-4 text-[#FFFEEF]">${fill.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 text-[#736A6C]">${fill.fee.toFixed(4)}</td>
                  <td className="py-4 text-[#544A4C]">{fill.orderId.slice(0, 8)}...</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-[#736A6C] text-center uppercase tracking-[0.2em]">No trade history found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
