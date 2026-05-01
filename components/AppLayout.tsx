'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07070D] text-[#EEEEFF] font-sans">
      <Sidebar />
      <TopBar />
      <main className="pl-[240px] pt-[52px] p-6 md:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
