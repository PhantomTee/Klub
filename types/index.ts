export type OrderTag = 'm' | 'l' | 'cx' | 'cxa' | 'mod' | 'st' | 'tp' | 'rng' | 'trig' | 'trl' | 'of';

export interface TradeLeg {
  id: string;
  tag: OrderTag;
  symbol: string;
  direction: 'buy' | 'sell';
  sizeUSD: number;
  sizeContracts: number | null;
  px: number | null;
  tif: 'GTC' | 'IOC' | 'ALO' | null;
  reduceOnly: boolean;
  isolated: boolean;
  triggerPrice: number | null;
  limitPrice: number | null;
  trailBps: number | null;
  stepBps: number | null;
  collarMin: number | null;
  collarMax: number | null;
  delaySeconds: number;
  onFill: { stopTrigger: number | null; tpTrigger: number | null } | null;
  nestedActions: TradeLeg[] | null;
  status: 'queued' | 'simulated' | 'submitted' | 'resting' | 'filled' | 'failed' | 'error';
  orderId: string | null;
  notes: string;
}

export interface TradePlan {
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  legs: TradeLeg[];
  risks: string[];
  totalNotionalUSD: number;
}

export interface ProtectionOrder {
  id: string;
  type: string;
  price: number;
  size: number;
}

export interface BulkPosition {
  symbol: string;
  size: number;
  price: number;
  fairPrice: number;
  notional: number;
  unrealizedPnl: number;
  realizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  maintenanceMargin: number;
  iso: boolean;
  isoPubkey?: string;
  protection: { orders: ProtectionOrder[] } | null;
}

export interface OpenOrder {
  id: string;
  symbol: string;
  isBuy: boolean;
  price: number;
  size: number;
  type: string;
  originalSize: number;
}

export interface FeeTier {
  makerBps: number;
  takerBps: number;
}

export interface AccountSnapshot {
  kind: 'MasterEOA' | 'SubAccount';
  margin: {
    totalBalance: number;
    availableBalance: number;
    marginUsed: number;
    notional: number;
    realizedPnl: number;
    unrealizedPnl: number;
    fees: number;
    funding: number;
  };
  positions: BulkPosition[];
  openOrders: OpenOrder[];
  subAccounts: { pubkey: string; name?: string }[];
  authorizedAgentWallets: string[];
  feeTiers: FeeTier[];
  leverageSettings: { symbol: string; leverage: number }[];
}

export interface GuardRailsConfig {
  maxPositionSizeUSD: number;
  maxMarginPercent: number;       // 0-1
  maxLeverage: number;
  requireStopLoss: boolean;
  autoApprove: boolean;
  dailyLossLimitUSD: number;
  bannedMarkets: string[];
  allowedMarketsOnly: boolean;
  allowedMarkets: string[];
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AgentSession {
  id: string;
  timestamp: number;
  intent: string;
  plan: TradePlan | null;
  approved: boolean;
  executionNonce: string | null;
}

export interface BulkCandle {
  t: number; T: number; o: number; h: number; l: number; c: number; v: number; n: number;
}
