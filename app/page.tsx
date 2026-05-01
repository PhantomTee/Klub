'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#141310] overflow-hidden flex flex-col">
      {/* Background Orbital Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#2A2620]/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-[#2A2620]/10 rounded-full" />
        <div className="absolute top-[10%] right-[10%] w-px h-64 bg-gradient-to-b from-transparent via-[#FFB547]/20 to-transparent" />
        <div className="absolute bottom-[20%] left-[5%] w-px h-48 bg-gradient-to-b from-transparent via-[#FFB547]/10 to-transparent" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-8">
        <div className="flex items-center space-x-2">
          <span className="font-sans font-bold text-2xl tracking-tighter text-[#FFFEEF]">(Klub.)</span>
        </div>
        <nav className="hidden md:flex items-center space-x-10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#C6B6BA]">
          <Link href="/dashboard" className="hover:text-[#FFB547] transition-colors">Platform</Link>
          <a href="#" className="hover:text-[#FFB547] transition-colors">Documentation</a>
          <Link href="/dashboard" className="px-5 py-2 border border-[#2A2620] hover:border-[#FFB547] text-[#FFFEEF] transition-all">
            Enter App
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <span className="inline-block px-3 py-1 bg-[#1B1A14] border border-[#2A2620] text-[10px] font-mono text-[#FFB547] uppercase tracking-[0.3em]">
            V1.0 Autonomous Liquidity
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-[12vw] md:text-[8vw] font-sans font-bold leading-[0.85] tracking-tighter text-[#FFFEEF] mb-12"
        >
          TRADE WITH <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB547] to-[#FFFEEF]">INTENTION.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="max-w-xl text-[#C6B6BA] text-sm md:text-base leading-relaxed mb-12 font-sans font-medium"
        >
          Experience the next evolution of intelligent trading on Solana. (Klub.) combines 
          agent-led execution with Bulk Trade's deep perpetual liquidity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6"
        >
          <Link 
            href="/dashboard"
            className="group relative px-10 py-5 bg-[#FFB547] text-[#141310] font-sans font-bold text-sm uppercase tracking-[0.15em] flex items-center justify-center transition-all hover:bg-[#D48F2A]"
          >
            Launch Terminal
          </Link>
          <button className="px-10 py-5 border border-[#2A2620] text-[#FFFEEF] font-sans font-bold text-sm uppercase tracking-[0.15em] hover:bg-[#1B1A14] transition-all">
            Join Waitlist
          </button>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 px-6 md:px-12 py-32 border-t border-[#2A2620]/50 bg-[#0C0B09]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-8 relative">
            <div className="text-[10px] font-mono text-[#544A4C] border-b border-[#2A2620] pb-2 w-12">
              01/
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[#FFFEEF]">Intent-Based Engine</h3>
            <p className="text-sm text-[#736A6C] leading-relaxed font-sans">
              Describe your trade in natural language. Our autonomous agent handles the complex legs, slippage settings, and execution timing on Bulk Trade.
            </p>
          </div>

          <div className="space-y-8">
            <div className="text-[10px] font-mono text-[#544A4C] border-b border-[#2A2620] pb-2 w-12">
              02/
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[#FFFEEF]">Risk Guard Rails</h3>
            <p className="text-sm text-[#736A6C] leading-relaxed font-sans">
              Institutional-grade safety. Define your maximum loss, leverage caps, and allowed markets before the first order is ever synthesized.
            </p>
          </div>

          <div className="space-y-8">
            <div className="text-[10px] font-mono text-[#544A4C] border-b border-[#2A2620] pb-2 w-12">
              03/
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[#FFFEEF]">DEX Integration</h3>
            <p className="text-sm text-[#736A6C] leading-relaxed font-sans">
              Seamlessly interact with Bulk Trade's deep liquidity pools with zero manual overhead. Optimized for low-latency perpetuals on Solana.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-[#2A2620]/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <span className="text-[10px] font-mono text-[#544A4C] uppercase tracking-widest">
          © 2026 (KLUB.) PROTOCOL / BUILT FOR BULK TRADE
        </span>
        <div className="flex space-x-8 text-[10px] font-mono text-[#544A4C] uppercase tracking-widest">
          <a href="#" className="hover:text-[#C6B6BA]">Twitter</a>
          <a href="#" className="hover:text-[#C6B6BA]">Discord</a>
          <a href="#" className="hover:text-[#C6B6BA]">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
