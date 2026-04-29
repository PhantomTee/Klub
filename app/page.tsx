'use client';

import React, { useState } from 'react';
import { useAgentStore } from '../store/agentStore';
import { usePortfolioStore } from '../store/portfolioStore';

export default function Home() {
  const [intentInput, setIntentInput] = useState('');
  const { isGenerating, setGenerating, setCurrentPlan } = useAgentStore();
  const { isConnected, setConnected } = usePortfolioStore();

  const handleDeployIntent = async () => {
    if (!intentInput.trim()) return;
    setGenerating(true);
    
    try {
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intentInput }),
      });
      
      const plan = await res.json();
      if (plan.error) {
         throw new Error(plan.error);
      }
      
      setCurrentPlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
      setIntentInput('');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-auto relative">
      {/* Navigation */}
      <nav className="px-6 py-6 md:px-12 md:py-8 flex justify-between items-center border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-serif tracking-tighter italic font-semibold">(Klub.)</span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium">
          <a href="#" className="hover:text-white transition-colors">Architecture</a>
          <a href="#" className="hover:text-white transition-colors">Execution</a>
          <a href="#" className="hover:text-white transition-colors">Governance</a>
        </div>
        <button 
          onClick={() => setConnected(!isConnected)}
          className="px-4 py-2 md:px-6 md:py-2 border border-zinc-700 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          {isConnected ? 'Connected' : 'Connect Agent'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Hero Section */}
        <div className="md:col-span-7 p-6 md:p-12 flex flex-col justify-center relative">
          <div className="space-y-2 mb-6 md:mb-6 mt-4 md:mt-0">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">v2.0 Intent Engine</span>
            <h1 className="text-5xl md:text-7xl font-serif leading-[1] md:leading-[0.9] tracking-tight">
              Autonomous <br />
              <span className="italic text-zinc-400 font-light">Liquidity</span> <br />
              Execution.
            </h1>
          </div>
          <p className="text-zinc-500 text-base md:text-lg max-w-md leading-relaxed mb-6 font-light">
            Define your desired outcome. Our AI-driven intent layer optimizes execution across 14 networks with zero slippage and maximal extraction.
          </p>

          <div className="flex flex-col gap-4 max-w-xl">
            <textarea
              className="bg-[#080808] border border-zinc-800 text-white p-4 font-mono text-sm h-32 md:h-32 focus:outline-none focus:border-emerald-500 transition-colors rounded-sm"
              placeholder="e.g. Scale into a $100k long on SOL over the next 30 minutes, keeping my maximum loss at $2k..."
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              disabled={isGenerating}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleDeployIntent}
                disabled={isGenerating}
                className="w-full sm:w-auto px-10 py-4 bg-white text-black font-semibold text-xs uppercase tracking-[0.15em] hover:bg-zinc-200 disabled:opacity-50"
              >
                {isGenerating ? 'Compiling...' : 'Deploy Intent'}
              </button>
              <button className="w-full sm:w-auto px-10 py-4 border border-zinc-800 text-white font-semibold text-xs uppercase tracking-[0.15em] hover:border-zinc-500">
                View Live Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Visual Agent Dashboard */}
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-zinc-800/50 bg-[#080808] p-6 md:p-8 flex flex-col min-h-[500px]">
          <div className="flex-1 flex flex-col justify-between">
            {/* Terminal Interface */}
            <div className="rounded-lg bg-black border border-zinc-800 p-4 md:p-6 font-mono text-[11px] h-[250px] md:h-[360px] overflow-hidden flex flex-col">
              <div className="flex justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0">
                <span className="text-zinc-500">AGENT_LOG: [KLUB-X1]</span>
                <span className="text-emerald-500 animate-pulse">ACTIVE</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 text-zinc-400">
                <div className="flex gap-2"><span className="text-zinc-600">SYS</span> <span>Engine initialized. Waiting for intent constraints...</span></div>
                {isGenerating && (
                  <div className="flex gap-2"><span className="text-zinc-600">SYS</span> <span className="animate-pulse">Parsing natural language intent parameters...</span></div>
                )}
                {/* Normally we'd render actual active session logs here */}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Total Value Solved</div>
                <div className="text-2xl font-serif">$412.8M</div>
              </div>
              <div className="p-4 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Active Agents</div>
                <div className="text-2xl font-serif">12,094</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="px-6 py-6 md:px-12 md:py-6 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center bg-[#070707] gap-6 md:gap-0 mt-auto">
        <div className="flex gap-6 md:gap-12 w-full md:w-auto justify-between md:justify-start">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Market Pulse</span>
            <span className="text-[11px] text-emerald-500 font-mono">+2.45% AVG. EFFICIENCY</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Network Consensus</span>
            <span className="text-[11px] text-zinc-400 font-mono">STABLE / 12MS LATENCY</span>
          </div>
        </div>
        <div className="text-zinc-700 text-[10px] uppercase tracking-widest text-center md:text-left">
          &copy; 2026 Klub Laboratory. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
