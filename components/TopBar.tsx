'use client';
import Link from 'next/link';
import { usePortfolioStore } from '../store/portfolioStore';
import { Menu } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const { snapshot } = usePortfolioStore();
  const { toggleSidebar } = useUIStore();
  const balance = snapshot?.margin?.totalBalance?.toLocaleString() || '0';
  const { prices } = usePortfolioStore();
  const mrkPrice = prices['BTC-USD'] ? prices['BTC-USD'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---";

  return (
    <div className="fixed top-0 left-0 right-0 h-[64px] bg-bg-base border-b border-border z-40 flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="mr-6 text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="font-sans font-bold text-[16px] tracking-tight text-text-primary md:hidden hover:opacity-80 transition-opacity">(Klub.)</Link>
      </div>

      <div className="flex items-center space-x-6 md:space-x-8">
        <div className="hidden lg:flex items-center space-x-8 text-[11px] font-mono text-text-secondary uppercase tracking-[0.2em]">
          <div className="flex space-x-6">
            <div className="flex space-x-3">
              <span className="text-text-tertiary">BTC-USD</span>
              <span className="text-text-primary font-bold">${mrkPrice}</span>
              <span className="text-success">+1.24%</span>
            </div>
            <div className="w-[1px] h-3 bg-border self-center" />
            <div className="flex space-x-3">
              <span className="text-text-tertiary">Margin</span>
              <span className="text-text-primary font-bold">${balance}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <WalletMultiButton style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '10px', height: '36px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '2px' }} />
        </div>
      </div>
    </div>
  );
}
