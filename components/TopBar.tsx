'use client';
import Link from 'next/link';
import { usePortfolioStore } from '../store/portfolioStore';
import { Menu } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function TopBar() {
  const { snapshot } = usePortfolioStore();
  const { toggleSidebar } = useUIStore();
  const balance = snapshot?.margin?.totalBalance?.toLocaleString() || '0';
  const { prices } = usePortfolioStore();
  const mrkPrice = prices['BTC-USD'] ? prices['BTC-USD'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---";

  return (
    <div className="fixed top-0 left-0 right-0 h-[64px] bg-[#141310] border-b border-[#2A2620] z-40 flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="mr-6 text-[#C6B6BA] hover:text-[#FFFEEF] transition-colors p-2 -ml-2"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="font-sans font-bold text-[16px] tracking-tight text-[#FFFEEF] md:hidden hover:opacity-80 transition-opacity">(Klub.)</Link>
      </div>

      <div className="flex items-center space-x-6 md:space-x-8">
        <div className="hidden lg:flex items-center space-x-8 text-[11px] font-mono text-[#C6B6BA] uppercase tracking-[0.2em]">
          <div className="flex space-x-6">
            <div className="flex space-x-3">
              <span className="text-[#736A6C]">BTC-USD</span>
              <span className="text-[#FFFEEF] font-bold">${mrkPrice}</span>
              <span className="text-[#00B481]">+1.24%</span>
            </div>
            <div className="w-[1px] h-3 bg-[#2A2620] self-center" />
            <div className="flex space-x-3">
              <span className="text-[#736A6C]">Margin</span>
              <span className="text-[#FFFEEF] font-bold">${balance}</span>
            </div>
          </div>
        </div>
        
        <WalletMultiButton style={{ backgroundColor: '#1B1A14', border: '1px solid #2A2620', color: '#FFFEEF', fontSize: '10px', height: '36px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }} />
      </div>
    </div>
  );
}
