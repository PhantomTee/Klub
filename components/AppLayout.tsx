'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '../store/uiStore';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div className="min-h-screen bg-[#141310] text-[#FFFEEF] font-sans overflow-x-hidden">
      {!isLanding && <Sidebar />}
      {!isLanding && <TopBar />}

      {/* Backdrop for blur and closing */}
      {isSidebarOpen && !isLanding && (
        <div 
          className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.main 
        animate={{ 
          filter: isSidebarOpen ? 'blur(8px)' : 'blur(0px)',
          opacity: isSidebarOpen ? 0.5 : 1
        }}
        transition={{ duration: 0.3 }}
        className={`${!isLanding ? 'pt-[64px]' : ''} min-h-screen relative`}
      >
        <div className={`${!isLanding ? 'p-4 md:p-8 max-w-7xl mx-auto' : ''}`}>
          {children}
        </div>
      </motion.main>
    </div>
  );
}
