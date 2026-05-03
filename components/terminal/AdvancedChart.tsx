'use client';
import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, BarSeries, LineSeries, BaselineSeries, HistogramSeries } from 'lightweight-charts';
import { useMarketStore } from '../../store/marketStore';

type ChartType = 'Candle' | 'Bar' | 'Line' | 'Baseline';

export default function AdvancedChart({ symbol = 'BTC-USD' }: { symbol: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState('1m');
  const [chartType, setChartType] = useState<ChartType>('Candle');
  
  // Get the wsManager from the store
  const wsManager = useMarketStore(state => state.wsManager);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark') || true;
    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: 'transparent' }, 
        textColor: '#8888AA' 
      },
      grid: { 
        vertLines: { color: isDark ? '#1B1A14' : '#1A1A2E' }, 
        horzLines: { color: isDark ? '#1B1A14' : '#1A1A2E' } 
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#2A2A42' },
      timeScale: { borderColor: '#2A2A42', timeVisible: true, secondsVisible: false },
    });

    let mainSeries: any;

    if (chartType === 'Candle') {
      mainSeries = chart.addSeries(CandlestickSeries, { upColor: '#22D3A5', downColor: '#F0524F', borderVisible: false, wickUpColor: '#22D3A5', wickDownColor: '#F0524F' });
    } else if (chartType === 'Bar') {
      mainSeries = chart.addSeries(BarSeries, { upColor: '#22D3A5', downColor: '#F0524F' });
    } else if (chartType === 'Line') {
      mainSeries = chart.addSeries(LineSeries, { color: '#7B5CF0', lineWidth: 2 });
    } else if (chartType === 'Baseline') {
      mainSeries = chart.addSeries(BaselineSeries, { baseValue: { type: 'price', price: 0 }, topLineColor: '#22D3A5', bottomLineColor: '#F0524F' });
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a', priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Handle WebSocket Data
    const topic = `candle.${symbol}.${timeframe}`;
    const handleData = (msg: any) => {
      if (msg.type === 'candle' && msg.data?.symbol === symbol && msg.data?.interval === timeframe) {
        const candles = msg.data.candles || [msg.data];
        const formattedData = candles.map((c: any) => ({
          time: Math.floor(c.t / 1000), // Convert ms to s
          open: parseFloat(c.o), high: parseFloat(c.h), low: parseFloat(c.l), close: parseFloat(c.c), value: parseFloat(c.c)
        }));
        
        const volData = candles.map((c: any) => ({
          time: Math.floor(c.t / 1000),
          value: parseFloat(c.v),
          color: parseFloat(c.c) >= parseFloat(c.o) ? 'rgba(34, 211, 165, 0.4)' : 'rgba(240, 82, 79, 0.4)'
        }));

        if (candles.length > 1) {
          mainSeries.setData(formattedData); 
          volumeSeries.setData(volData);
        } else if (candles.length === 1) {
          mainSeries.update(formattedData[0]); 
          volumeSeries.update(volData[0]);
        }
      }
    };

    wsManager.subscribe(topic, { type: 'candle', symbol, interval: timeframe });
    
    // Patch the onMessage to handle our chart data as well
    const originalOnMessage = wsManager.onMessage;
    wsManager.onMessage = (msg: any) => {
      handleData(msg);
      if (originalOnMessage) originalOnMessage(msg);
    };

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth, height: chartContainerRef.current?.clientHeight });
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      wsManager.unsubscribe(topic);
      wsManager.onMessage = originalOnMessage;
      chart.remove();
    };
  }, [symbol, timeframe, chartType, wsManager]);

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[5] opacity-[0.03] text-[10vw] font-bold pointer-events-none select-none text-white whitespace-nowrap">
        {symbol.replace('-', ' / ')}
      </div>
      <div className="absolute top-14 left-4 z-10 opacity-80 text-[20px] font-medium pointer-events-none select-none text-white/50 tracking-wide">
        {symbol.replace('-', ' / ')} • {timeframe}
      </div>
      <div className="flex gap-2 p-2 px-4 shadow-sm z-10 absolute top-0 left-0">
        {/* Timeframes */}
        {['10s', '1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
          <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-1 text-[10px] font-mono tracking-wider rounded ${timeframe === tf ? 'bg-accent text-bg-base font-bold' : 'text-text-tertiary hover:bg-white/5'}`}>{tf}</button>
        ))}
        <div className="w-px h-4 bg-border mx-2 self-center" />
        {['Candle', 'Bar', 'Line', 'Baseline'].map(ct => (
          <button key={ct} onClick={() => setChartType(ct as ChartType)} className={`px-2 py-1 text-[10px] font-mono tracking-wider rounded ${chartType === ct ? 'bg-white/10 text-white font-bold' : 'text-text-tertiary hover:bg-white/5'}`}>{ct}</button>
        ))}
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full pt-10" />
    </div>
  );
}
