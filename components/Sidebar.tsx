'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Terminal', href: '/terminal' },
    { name: 'Agent', href: '/agent' },
    { name: 'Bulk Trades', href: '/bulk' },
    { name: 'History', href: '/history' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Mobile/Overlay Backdrop managed in Layout but we can put it here if we want absolute control */}
          <motion.div
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 w-[240px] h-screen bg-[#141310] border-r border-[#2A2620] flex flex-col z-50 shadow-2xl"
          >
            <div className="h-[64px] flex items-center justify-between px-6 shrink-0 border-b border-[#2A2620]">
              <span className="font-sans font-bold text-[18px] tracking-tight text-[#FFFEEF]">(Klub.)</span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-[#736A6C] hover:text-[#FFFEEF] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-8 space-y-2">
              {links.map((link) => {
                const isActive = pathname === link.href || (pathname === '/' && link.href === '/dashboard');
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-[10px] rounded-[2px] text-[11px] uppercase tracking-[0.15em] font-mono transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#1B1A14] text-[#FFB547] border-l-2 border-[#FFB547]' 
                        : 'text-[#C6B6BA] hover:text-[#FFFEEF] hover:bg-[#1B1A14]'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
