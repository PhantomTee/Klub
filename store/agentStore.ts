import { create } from 'zustand';
import { AgentSession, TradePlan } from '../types';

interface AgentStore {
  sessions: AgentSession[];
  currentPlan: TradePlan | null;
  isGenerating: boolean;
  agentPubkey: string | null;
  logs: { id: string; timestamp: number; message: string; type: 'sys' | 'error' | 'success' }[];
  addSession: (s: AgentSession) => void;
  setCurrentPlan: (p: TradePlan | null) => void;
  setGenerating: (v: boolean) => void;
  setAgentPubkey: (pk: string | null) => void;
  addLog: (msg: string, type?: 'sys' | 'error' | 'success') => void;
  clearLogs: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  sessions: [],
  currentPlan: null,
  isGenerating: false,
  agentPubkey: null,
  logs: [],
  addSession: (s) => set((state) => ({ sessions: [s, ...state.sessions] })),
  setCurrentPlan: (p) => set({ currentPlan: p }),
  setGenerating: (v) => set({ isGenerating: v }),
  setAgentPubkey: (pk) => set({ agentPubkey: pk }),
  addLog: (msg, type = 'sys') => set((state) => ({ 
    logs: [...state.logs, { id: Math.random().toString(), timestamp: Date.now(), message: msg, type }] 
  })),
  clearLogs: () => set({ logs: [] })
}));
