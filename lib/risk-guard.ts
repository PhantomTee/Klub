import { TradePlan, AccountSnapshot, GuardRailsConfig, ValidationResult } from '../types';

export function validatePlan(
  plan: TradePlan, 
  account: AccountSnapshot, 
  settings: GuardRailsConfig
): ValidationResult {
  const violations: string[] = [];
  
  for (const leg of plan.legs) {
    if (leg.sizeUSD > settings.maxPositionSizeUSD) {
      violations.push(`${leg.symbol}: exceeds max position size ($${settings.maxPositionSizeUSD})`);
    }
    const marginPercent = account.margin.totalBalance > 0 ? (leg.sizeUSD / account.margin.totalBalance) : 1;
    if (marginPercent > settings.maxMarginPercent) {
      violations.push(`${leg.symbol}: exceeds max margin % (${settings.maxMarginPercent * 100}%)`);
    }
    if (settings.bannedMarkets.includes(leg.symbol)) {
      violations.push(`${leg.symbol}: banned market`);
    }
    if (settings.allowedMarketsOnly && !settings.allowedMarkets.includes(leg.symbol)) {
      violations.push(`${leg.symbol}: market not in allowed list`);
    }
    if (settings.requireStopLoss && !leg.onFill?.stopTrigger && leg.tag === 'm') {
      violations.push(`${leg.symbol}: stop-loss required for market orders`);
    }
  }
  
  if (account.margin.realizedPnl < -settings.dailyLossLimitUSD) {
    violations.push(`Daily loss limit reached ($${settings.dailyLossLimitUSD}) — agent halted`);
  }
  
  const riskLevel = violations.length === 0
    ? plan.totalNotionalUSD > settings.maxPositionSizeUSD * 0.8 ? 'medium' : 'low'
    : 'high';
  
  return { valid: violations.length === 0, violations, riskLevel };
}
