import { TradeLeg } from '../types';

export function legToAction(leg: TradeLeg, markPrices: Record<string, number>): any | any[] {
  const mark = markPrices[leg.symbol] ?? 1;
  const sz = Number((leg.sizeUSD / mark).toFixed(4));
  const isBuy = leg.direction === 'buy';
  
  let entryAction: any;
  switch (leg.tag) {
    case 'm': 
      entryAction = { m: { c: leg.symbol, b: isBuy, sz, r: leg.reduceOnly || false, i: leg.isolated || false } };
      break;
    case 'l': 
      entryAction = { l: { c: leg.symbol, b: isBuy, px: leg.px!, sz, tif: leg.tif ?? 'GTC', r: leg.reduceOnly || false, i: leg.isolated || false } };
      break;
    case 'st': 
      entryAction = { st: { c: leg.symbol, d: leg.triggerPrice! > mark, sz, tr: leg.triggerPrice!, lim: leg.limitPrice ?? null, i: leg.isolated || false } };
      break;
    case 'tp': 
      entryAction = { tp: { c: leg.symbol, d: isBuy, sz, tr: leg.triggerPrice!, lim: leg.limitPrice ?? null, i: leg.isolated || false } };
      break;
    case 'rng': 
      entryAction = { rng: { c: leg.symbol, d: isBuy, sz, pmin: leg.collarMin!, pmax: leg.collarMax!, lmin: null, lmax: null, i: leg.isolated || false } };
      break;
    case 'trl': 
      entryAction = { trl: { c: leg.symbol, b: isBuy, sz, trb: leg.trailBps!, stb: leg.stepBps!, lim: null, i: leg.isolated || false } };
      break;
    default: 
      throw new Error(`Unknown leg tag: ${leg.tag}`);
  }

  return withOnFill(entryAction, 0, leg, sz);
}

function withOnFill(entryAction: any, parentIndex: number, leg: TradeLeg, sz: number): any[] {
  const result: any[] = [entryAction];
  if (leg.onFill?.stopTrigger || leg.onFill?.tpTrigger) {
    const consequents: any[] = [];
    if (leg.onFill.stopTrigger)
      consequents.push({ st: { c: leg.symbol, d: false, sz, tr: leg.onFill.stopTrigger, lim: null, i: leg.isolated || false } });
    if (leg.onFill.tpTrigger)
      consequents.push({ tp: { c: leg.symbol, d: true,  sz, tr: leg.onFill.tpTrigger,  lim: null, i: leg.isolated || false } });
    result.push({ of: { p: parentIndex, actions: consequents } });
  }
  return result;
}
