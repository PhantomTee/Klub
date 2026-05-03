import { useUIStore } from '../store/uiStore';

function getWsUrl() {
  const env = useUIStore.getState().environment;
  return env === 'testnet' ? 'wss://testnet-ws1.bulk.trade' : 'wss://exchange-ws1.bulk.trade';
}

function getHttpUrl() {
  const env = useUIStore.getState().environment;
  return env === 'testnet' ? 'https://testnet-api.bulk.trade/api/v1' : 'https://exchange-api.bulk.trade/api/v1';
}

export class BulkTVDatafeed {
  private lastBarsCache = new Map<string, any>();
  private priceMode: "mark" | "oracle" | "last";
  private socket: WebSocket | null = null;
  private wsConnected = false;
  private messageQueue: any[] = [];
  private subscriptions = new Map<string, any>();
  private wsReconnectTimeout: any = null;

  private resolutionToInterval: Record<string, string> = {
    "10S": "10s",
    "1": "1m",
    "3": "3m",
    "5": "5m",
    "15": "15m",
    "30": "30m",
    "60": "1h",
    "120": "2h",
    "240": "4h",
    "360": "6h",
    "720": "12h",
    "1D": "1d",
    "1W": "1w",
  };

  constructor(priceMode: "mark" | "oracle" | "last" = "last") {
    this.priceMode = priceMode;
    this.initWebSocket();
  }

  public setPriceMode(mode: "mark" | "oracle" | "last") {
    this.priceMode = mode;
  }

  public reconnect() {
    this.initWebSocket();
  }

  private initWebSocket() {
    if (this.socket) {
      // remove onclose properly
      this.socket.onclose = null;
      try { this.socket.close(); } catch (e) {}
    }
    
    this.socket = new WebSocket(getWsUrl());
    
    this.socket.onopen = () => {
      this.wsConnected = true;
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        this.socket?.send(JSON.stringify(msg));
      }
      
      // Resubscribe if reconnected
      for (const [subUID, subInfo] of this.subscriptions.entries()) {
        const msg = {
          method: "subscribe",
          subscription: [{ type: "candle", symbol: subInfo.symbol, interval: subInfo.interval }]
        };
        this.socket.send(JSON.stringify(msg));
      }
    };
    
    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "candle" && msg.data && msg.data.candles) {
          const candles = msg.data.candles;
          const symbolStr = msg.data.symbol || msg.data.candles[0]?.c;
          for (const [subUID, subInfo] of this.subscriptions.entries()) {
             const candleArray = Array.isArray(candles) ? candles : [candles];
             for (const candle of candleArray) {
               const bar = {
                 time: candle.t / 1000,
                 open: parseFloat(candle.o),
                 high: parseFloat(candle.h),
                 low: parseFloat(candle.l),
                 close: parseFloat(candle.c),
                 volume: parseFloat(candle.v)
               };
               subInfo.onRealtimeCallback(bar);
             }
          }
        }
      } catch (e) {}
    };
    
    this.socket.onclose = () => {
      this.wsConnected = false;
      this.wsReconnectTimeout = setTimeout(() => {
        this.initWebSocket();
      }, 2000);
    };
    
    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private sendWsMessage(msg: any) {
    if (this.wsConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    } else {
      this.messageQueue.push(msg);
    }
  }

  public onReady(callback: (config: any) => void) {
    setTimeout(() => {
      callback({
        supported_resolutions: ["10S", "1", "3", "5", "15", "30", "60", "120", "240", "360", "720", "1D", "1W"],
        exchanges: [{ value: "BULK", name: "Bulk Trade", desc: "Bulk Trade Perpetuals" }],
        symbols_types: [{ name: "Crypto Perpetuals", value: "crypto" }],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
      });
    }, 0);
  }

  public async searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: (res: any[]) => void) {
    try {
      const response = await fetch(`${getHttpUrl()}/exchangeInfo`);
      const data = await response.json();
      
      const userInputLower = userInput.toLowerCase();
      
      const searchResults = (data || [])
        .filter((market: any) => market.symbol.toLowerCase().includes(userInputLower))
        .map((market: any) => ({
          symbol: market.symbol,
          full_name: `BULK:${market.symbol}`,
          description: `${market.baseAsset} / ${market.quoteAsset} Perpetual`,
          exchange: "BULK",
          ticker: market.symbol,
          type: "crypto"
        }));
        
      onResult(searchResults);
    } catch (e) {
      console.warn("Failed to search symbols", e);
      onResult([]);
    }
  }

  public async resolveSymbol(symbolName: string, onResolve: (sym: any) => void, onError: (err: string) => void) {
    try {
      const parsedSymbolName = symbolName.includes(":") ? symbolName.split(":")[1] : symbolName;
      const strippedSymbol = parsedSymbolName.split(":")[0];

      const response = await fetch(`${getHttpUrl()}/exchangeInfo`);
      const data = await response.json();
      
      const market = data.find((m: any) => m.symbol === strippedSymbol);
      
      if (!market) {
        throw new Error("Cannot resolve symbol");
      }

      setTimeout(() => {
        onResolve({
          name: market.symbol,
          full_name: `BULK:${market.symbol}`,
          description: `${market.baseAsset} / ${market.quoteAsset} Perpetual`,
          type: "crypto",
          session: "24x7",
          timezone: "Etc/UTC",
          exchange: "BULK",
          minmov: 1,
          pricescale: Math.pow(10, market.pricePrecision || 2),
          has_intraday: true,
          has_weekly_and_monthly: true,
          supported_resolutions: ["10S", "1", "3", "5", "15", "30", "60", "120", "240", "360", "720", "1D", "1W"],
          volume_precision: market.quantityPrecision || 4,
          data_status: "streaming",
        });
      }, 0);
    } catch (e: any) {
      setTimeout(() => onError(e.message), 0);
    }
  }

  public async getBars(symbolInfo: any, resolution: string, periodParams: any, onResult: (bars: any[], meta: any) => void, onError: (err: string) => void) {
    const { from, to, firstDataRequest } = periodParams;
    const bulkInterval = this.resolutionToInterval[resolution] || "1m";
    
    try {
      const response = await fetch(`${getHttpUrl()}/klines?symbol=${symbolInfo.name}&interval=${bulkInterval}&startTime=${from * 1000}&endTime=${to * 1000}`);
      
      if (!response.ok) {
        throw new Error("Bad network response");
      }

      const candles = await response.json();
      
      if (!candles || candles.length === 0) {
        onResult([], { noData: true });
        return;
      }

      const finalBars = candles.map((candle: any) => ({
         time: Math.floor(candle.t / 1000), 
         open: parseFloat(candle.o),
         high: parseFloat(candle.h),
         low: parseFloat(candle.l),
         close: parseFloat(candle.c),
         volume: parseFloat(candle.v)
      }));
      
      if (firstDataRequest) {
        this.lastBarsCache.set(symbolInfo.name, finalBars[finalBars.length - 1]);
      }
      
      onResult(finalBars.length ? finalBars : [], { noData: finalBars.length === 0 });
    } catch (e: any) {
      console.warn("getBars error:", e);
      onError(e.message);
    }
  }

  public subscribeBars(symbolInfo: any, resolution: string, onRealtimeCallback: (bar: any) => void, subscriberUID: string, onResetCacheNeeded: () => void) {
    const bulkInterval = this.resolutionToInterval[resolution] || "1m";
    
    this.subscriptions.set(subscriberUID, {
      symbol: symbolInfo.name,
      interval: bulkInterval,
      onRealtimeCallback
    });
    
    this.sendWsMessage({
      method: "subscribe",
      subscription: [{ type: "candle", symbol: symbolInfo.name, interval: bulkInterval }]
    });
  }

  public unsubscribeBars(subscriberUID: string) {
    const sub = this.subscriptions.get(subscriberUID);
    if (sub) {
      this.sendWsMessage({
        method: "unsubscribe",
        subscription: [{ type: "candle", symbol: sub.symbol, interval: sub.interval }]
      });
      this.subscriptions.delete(subscriberUID);
    }
  }
}
