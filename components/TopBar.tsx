'use client';
import { usePortfolioStore } from '../store/portfolioStore';

export function TopBar() {
  const { snapshot } = usePortfolioStore();
  const balance = snapshot?.margin?.totalBalance?.toLocaleString() || '0';
  const mrkPrice = "98,421.50"; // Mock

  return (
    <div className="fixed top-0 left-[240px] right-0 h-[52px] bg-[#07070D] border-b border-[#1A1A2E] z-10 flex items-center justify-end px-6">
      <div className="flex items-center space-x-6 text-[12px] font-mono text-[#8888AA]">
        <div className="flex space-x-2">
          <span>BTC-USD</span>
          <span className="text-[#EEEEFF]">${mrkPrice}</span>
          <span className="text-[#22D3A5]">+1.24%</span>
        </div>
        <div className="flex space-x-2">
          <span>Margin</span>
          <span className="text-[#EEEEFF]">${balance}</span>
        </div>
      </div>
    </div>
  );
}
