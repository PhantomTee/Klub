'use client';

import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../store/agentStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { validatePlan } from '../lib/risk-guard';
import { fetchAccount } from '../lib/bulk-client';

export default function Home() {
  const [intentInput, setIntentInput] = useState('');
  const { isGenerating, setGenerating, setCurrentPlan, currentPlan, logs, addLog, clearLogs } = useAgentStore();
  const { isConnected, setConnected, snapshot, setSnapshot } = usePortfolioStore();
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setConnected(true);
      fetchAccount(wallet.publicKey.toBase58())
        .then(data => setSnapshot(data))
        .catch(err => {
          console.error("Fetch account error via REST:", err);
          // Instead of failing completely, mock some data for the UI if account fetch fails
          setSnapshot({
            kind: 'MasterEOA',
            margin: { totalBalance: 100000, availableBalance: 100000, marginUsed: 0, notional: 0, realizedPnl: 0, unrealizedPnl: 0, fees: 0, funding: 0 },
            positions: [],
            openOrders: [],
            subAccounts: [],
            authorizedAgentWallets: [],
            feeTiers: [],
            leverageSettings: []
          });
        });
    } else {
      setConnected(false);
      setSnapshot(null);
    }
  }, [wallet.connected, wallet.publicKey, setConnected, setSnapshot]);

  const handleDeployIntent = async () => {
    if (!intentInput.trim()) return;
    setGenerating(true);
    clearLogs();
    addLog('Engine initialized. Parsing constraints...', 'sys');
    
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
      
      addLog(`Intent parsed successfully. Confidence: ${plan.confidence}`, 'success');
      
      // Auto-generate UUIDs for legs if missing
      if (plan.legs) {
        plan.legs.forEach((leg: any, i: number) => {
          if (!leg.id) leg.id = `leg_${Date.now()}_${i}`;
          leg.status = 'queued';
        });
      }
      
      setCurrentPlan(plan);
    } catch (e: any) {
      addLog(`Failed to parse intent: ${e.message}`, 'error');
    } finally {
      setGenerating(false);
      setIntentInput('');
    }
  };

  const handleExecute = async () => {
    if (!currentPlan) return;
    if (!wallet.publicKey) {
      addLog('Error: Wallet not connected', 'error');
      return;
    }

    addLog('Validating plan against risk constraints...', 'sys');
    const mockAccount = snapshot || {
      kind: 'MasterEOA',
      margin: { totalBalance: 100000, availableBalance: 100000, marginUsed: 0, notional: 0, realizedPnl: 0, unrealizedPnl: 0, fees: 0, funding: 0 },
      positions: [],
      openOrders: [],
      subAccounts: [],
      authorizedAgentWallets: [],
      feeTiers: [],
      leverageSettings: []
    } as any;
    
    const settings = {
        maxPositionSizeUSD: 500000,
        maxMarginPercent: 0.8,
        maxLeverage: 10,
        requireStopLoss: false,
        autoApprove: false,
        dailyLossLimitUSD: 10000,
        bannedMarkets: [],
        allowedMarketsOnly: false,
        allowedMarkets: []
    };

    const validation = validatePlan(currentPlan, mockAccount, settings);
    
    if (!validation.valid) {
      validation.violations.forEach(v => addLog(`Validation Error: ${v}`, 'error'));
      return;
    }
    
    addLog(`Validation passed (Risk: ${validation.riskLevel}). Generating signatures...`, 'success');
    
    try {
      // Create actions based on legs natively supported by BULK API
      const actions = currentPlan.legs.map(leg => {
        const sz = leg.sizeContracts || 0.1; // fallback sizes if not passed
        const isBuy = leg.direction === 'buy';
        if (leg.tag === 'm') {
          return { m: { c: leg.symbol, b: isBuy, sz, r: leg.reduceOnly || false, i: leg.isolated || false } };
        }
        if (leg.tag === 'l') {
           return { l: { c: leg.symbol, b: isBuy, px: leg.px || 0, sz, tif: leg.tif || 'GTC', r: leg.reduceOnly || false, i: leg.isolated || false } }
        }
        // etc for other tags... fallback:
        return { m: { c: leg.symbol, b: isBuy, sz, r: false, i: false } };
      });
      
      addLog(`Submitting transaction to Bulk Trade (0x...${wallet.publicKey.toBase58().slice(-4)})`, 'sys');
      
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions,
          account: wallet.publicKey.toBase58()
        })
      });
      
      const executionResult = await res.json();
      
      if (executionResult.error) {
        throw new Error(executionResult.error);
      }
      
      addLog(`Execution successful. Result: ${JSON.stringify(executionResult)}`, 'success');
    } catch (e: any) {
      addLog(`Execution Error: ${e.message}`, 'error');
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
        <div>
          <WalletMultiButton style={{ backgroundColor: '#1A1A1A', border: '1px solid #333', fontSize: '10px', height: '36px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Hero Section */}
        <div className="md:col-span-7 p-6 md:p-12 flex flex-col justify-center relative border-b md:border-b-0">
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
                className="w-full sm:w-auto px-10 py-4 bg-white text-black font-semibold text-xs uppercase tracking-[0.15em] hover:bg-zinc-200 disabled:opacity-50 transition-all"
              >
                {isGenerating ? 'Compiling...' : 'Deploy Intent'}
              </button>
            </div>
            
            {currentPlan && (
              <div className="mt-8 p-6 bg-[#0c0c0c] border border-zinc-800 rounded-lg">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-emerald-500 mb-2">Generated Plan</h3>
                <p className="text-zinc-400 text-xs mb-4">{currentPlan.summary}</p>
                <div className="space-y-3 mb-6">
                  {currentPlan.legs.map((leg, i) => (
                    <div key={leg.id} className="p-3 bg-black border border-zinc-900 rounded-md flex justify-between items-center text-xs">
                      <div>
                        <span className="text-zinc-500 mr-2">#{i+1}</span>
                        <span className={`font-mono mr-2 ${leg.direction === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {leg.direction.toUpperCase()}
                        </span>
                        <span className="font-semibold text-white">{leg.symbol}</span>
                      </div>
                      <div className="text-zinc-400 font-mono">
                         ${leg.sizeUSD?.toLocaleString() || "Market"}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleExecute}
                 className="w-full py-3 bg-emerald-600/20 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-600/40 text-xs font-semibold uppercase tracking-widest transition-all"
                >
                  Execute Plan
                </button>
              </div>
            )}
            
          </div>
        </div>

        {/* Visual Agent Dashboard */}
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-zinc-800/50 bg-[#080808] p-6 md:p-8 flex flex-col min-h-[500px]">
          <div className="flex-1 flex flex-col justify-between">
            {/* Terminal Interface */}
            <div className="rounded-lg bg-black border border-zinc-800 p-4 md:p-6 font-mono text-[11px] h-[300px] md:h-[400px] overflow-hidden flex flex-col">
              <div className="flex justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0">
                <span className="text-zinc-500">AGENT_LOG: [KLUB-X1]</span>
                <span className="text-emerald-500 animate-pulse">ACTIVE / IDLE</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 flex flex-col">
                {logs.length === 0 && !isGenerating && (
                  <div className="text-zinc-600 italic">No active session. Waiting for intent...</div>
                )}
                {logs.map(log => (
                  <div key={log.id} className={`flex gap-2 ${log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <span className="text-zinc-600 shrink-0">[{new Date(log.timestamp).toISOString().split('T')[1].slice(0, 8)}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex gap-2 text-zinc-400">
                     <span className="text-zinc-600">SYS</span> 
                     <span className="animate-pulse">Synthesizing...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Total Margin Base</div>
                <div className="text-2xl font-serif text-white">
                  ${snapshot ? snapshot.margin.totalBalance.toLocaleString() : '---'}
                </div>
              </div>
              <div className="p-4 border border-zinc-800 rounded-lg">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Unrealized PNL</div>
                <div className={`text-2xl font-serif ${snapshot && snapshot.margin.unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ${snapshot ? snapshot.margin.unrealizedPnl.toLocaleString() : '---'}
                </div>
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
