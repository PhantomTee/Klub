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
    { name: 'Markets', href: '/markets' },
    { name: 'Agent', href: '/agent' },
    { name: 'Execution', href: '/bulk' },
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
            className="fixed top-0 left-0 w-[240px] h-screen bg-bg-base border-r border-border flex flex-col z-50 shadow-2xl"
          >
            <div className="h-[64px] flex items-center justify-between px-6 shrink-0 border-b border-border">
              <Link href="/" onClick={() => setSidebarOpen(false)} className="font-sans font-bold text-[18px] tracking-tight text-text-primary hover:opacity-80 transition-opacity">
                (Klub.)
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
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
                        ? 'bg-bg-panel text-accent border-l-2 border-accent' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel'
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
