import { create } from 'zustand';
import { AgentSession, TradePlan } from '../types';

interface AgentStore {
  sessions: AgentSession[];
  currentPlan: TradePlan | null;
  isGenerating: boolean;
  agentPubkey: string | null;
  addSession: (s: AgentSession) => void;
  setCurrentPlan: (p: TradePlan | null) => void;
  setGenerating: (v: boolean) => void;
  setAgentPubkey: (pk: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  sessions: [],
  currentPlan: null,
  isGenerating: false,
  agentPubkey: null,
  addSession: (s) => set((state) => ({ sessions: [s, ...state.sessions] })),
  setCurrentPlan: (p) => set({ currentPlan: p }),
  setGenerating: (v) => set({ isGenerating: v }),
  setAgentPubkey: (pk) => set({ agentPubkey: pk }),
}));
