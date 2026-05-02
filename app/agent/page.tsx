'use client';

import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { validatePlan } from '../../lib/risk-guard';
import { fetchAccount } from '../../lib/bulk-client';

import { Shield, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
 
 export default function AgentPage() {
   const [intentInput, setIntentInput] = useState('');
   const { isGenerating, setGenerating, setCurrentPlan, currentPlan, logs, addLog, clearLogs } = useAgentStore();
   const { isConnected, snapshot } = usePortfolioStore();
   const wallet = useWallet();
 
   const AGENT_PUBKEY = process.env.NEXT_PUBLIC_KLUB_AGENT_PUBLIC_KEY || 'KlubAgnt11111111111111111111111111111111111';
   const isAuthorized = snapshot?.authorizedAgentWallets?.includes(AGENT_PUBKEY);

  const handleDeployIntent = async () => {
    if (!intentInput.trim()) return;
    
    setGenerating(true);
    clearLogs();
    addLog(`Synthesizing intent: "${intentInput.slice(0, 30)}..."`, 'sys');
    
    try {
      console.log('Sending intent to /api/agent:', intentInput);
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: intentInput }),
      });
      
      const plan = await res.json();
      console.log('Received plan:', plan);
      
      if (plan.error) {
        throw new Error(plan.error);
      }
      
      if (plan.legs) {
        plan.legs.forEach((leg: any, i: number) => {
          leg.id = `leg_${Date.now()}_${i}`;
          leg.status = 'queued';
        });
      }
      
      addLog(`Intent parsed successfully. Confidence: ${plan.confidence}`, 'success');
      setCurrentPlan(plan);
    } catch (e: any) {
      addLog(`Failed to synthesize: ${e.message}`, 'error');
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
      const actions = currentPlan.legs.map(leg => {
        const sz = leg.sizeContracts || 0.1; 
        const isBuy = leg.direction === 'buy';
        if (leg.tag === 'm') {
          return { m: { c: leg.symbol, b: isBuy, sz, r: leg.reduceOnly || false, i: leg.isolated || false } };
        }
        if (leg.tag === 'l') {
           return { l: { c: leg.symbol, b: isBuy, px: leg.px || 0, sz, tif: leg.tif || 'GTC', r: leg.reduceOnly || false, i: leg.isolated || false } }
        }
        return { m: { c: leg.symbol, b: isBuy, sz, r: false, i: false } };
      });
      
      addLog(`Submitting transaction to Bulk Trade DEX (0x...${wallet.publicKey.toBase58().slice(-4)})`, 'sys');
      
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
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left Pane - Intent Input & Code output */}
      <div className="flex-1 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Intent Engine</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest ${
            isAuthorized ? 'bg-[#22D3A5]/10 border-[#22D3A5]/30 text-[#22D3A5]' : 'bg-[#EF4A3C]/10 border-[#EF4A3C]/30 text-[#EF4A3C]'
          }`}>
            {isAuthorized ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
            <span>Agent: {isAuthorized ? 'Authorized' : 'Unauthorized'}</span>
          </div>
        </div>

        <div className="p-4 bg-[#1B1A14] border border-[#2A2620] rounded-md mb-6">
          <textarea
            value={intentInput}
            onChange={(e) => setIntentInput(e.target.value)}
            className="w-full h-32 bg-transparent border-none outline-none resize-none font-mono text-sm placeholder-[#555570] mb-4 text-[#EEEEFF]"
            placeholder="e.g. Long 0.1 BTC-USD at market. Attach stop at $98k and TP at $106k. Isolated."
            disabled={isGenerating}
          />
          <div className="flex justify-between items-center border-t border-[#1A1A2E] pt-4">
            <span className="text-xs text-[#555570] font-mono">
              Margin: ${snapshot?.margin?.availableBalance?.toLocaleString() || '100,000'} | Positions: {snapshot?.positions?.length || 0}
            </span>
            <button 
              onClick={handleDeployIntent}
              disabled={isGenerating || !intentInput.trim()}
              className="px-6 py-2 bg-[#FFB547] text-[#141310] font-sans font-bold text-sm rounded-[2px] hover:bg-[#D48F2A] disabled:opacity-50 transition-colors uppercase tracking-[0.11em]"
            >
              {isGenerating ? 'PARSING...' : 'GENERATE PLAN'}
            </button>
          </div>
        </div>

        {currentPlan && (
          <div className="p-6 bg-[#1B1A14] border-l-4 border-[#FFB547] rounded-r-[2px]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-[#EEEEFF] mb-1">Generated Trade Plan</h3>
                <p className="text-[#8888AA] text-xs">{currentPlan.summary}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-mono uppercase rounded ${currentPlan.confidence === 'high' ? 'bg-[#22D3A5] text-[#16162A]' : 'bg-[#E8A035] text-[#16162A]'}`}>
                {currentPlan.confidence} Confidence
              </span>
            </div>
            
            <div className="space-y-3 mb-6">
              {currentPlan.legs.map((leg: any, i: number) => (
                <div key={leg.id} className="p-3 bg-[#16162A] border border-[#2A2A42] rounded-md flex justify-between items-center text-sm font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="text-[#555570]">#{i+1}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${leg.direction === 'buy' ? 'bg-[#22D3A5]/20 text-[#22D3A5]' : 'bg-[#F0524F]/20 text-[#F0524F]'}`}>
                      {leg.direction.toUpperCase()}
                    </span>
                    <span className="text-[#EEEEFF]">{leg.symbol}</span>
                    <span className="text-[#8888AA]">{leg.tag?.toUpperCase()}</span>
                  </div>
                  <div className="text-[#EEEEFF]">
                     ${leg.sizeUSD?.toLocaleString() || "Market"}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={handleExecute}
                className="flex-1 py-2 bg-[#FFB547] text-[#141310] font-sans font-bold text-sm rounded-[2px] hover:bg-[#D48F2A] transition-colors uppercase tracking-[0.11em]"
              >
                Approve & Execute All
              </button>
              <button className="px-6 py-2 bg-transparent text-[#F0524F] border border-[#F0524F]/30 font-sans font-medium text-sm rounded-[2px] hover:bg-[#F0524F]/10 transition-colors uppercase tracking-[0.11em]">
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Pane - Logs */}
      <div className="w-full md:w-[320px] lg:w-[400px] flex flex-col">
        <h2 className="text-xl font-medium mb-4">Session History</h2>
        <div className="flex-1 p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md font-mono text-xs h-[500px] flex flex-col">
           <div className="flex justify-between border-b border-[#1A1A2E] pb-2 mb-4 shrink-0">
             <span className="text-[#555570]">AGENT_LOG</span>
             <span className="text-[#22D3A5] animate-pulse">ACTIVE / IDLE</span>
           </div>
           <div className="space-y-3 overflow-y-auto flex-1 text-[#8888AA] flex flex-col">
             {logs.length === 0 && !isGenerating && (
               <div className="italic text-[#555570]">Waiting for intent...</div>
             )}
             {logs.map(log => (
               <div key={log.id} className={`flex gap-3 leading-relaxed ${log.type === 'error' ? 'text-[#F0524F]' : log.type === 'success' ? 'text-[#22D3A5]' : 'text-[#8888AA]'}`}>
                 <span className="text-[#555570] shrink-0">[{new Date(log.timestamp).toISOString().split('T')[1].slice(0, 8)}]</span>
                 <span className="break-words">{log.message}</span>
               </div>
             ))}
             {isGenerating && (
               <div className="flex gap-3 text-[#E8A035]">
                  <span className="text-[#555570] shrink-0">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span>
                  <span className="animate-pulse">Synthesizing...</span>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
