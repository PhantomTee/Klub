'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp, CandlestickSeries } from 'lightweight-charts';

export function TradingChart({ symbol = 'BTC-USD', interval = '1m' }: { symbol?: string, interval?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const dataSetRef = useRef(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#C6B6BA' : '#544A4C',
      },
      grid: {
        vertLines: { color: isDark ? '#1B1A14' : '#E8E5DA' },
        horzLines: { color: isDark ? '#1B1A14' : '#E8E5DA' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00B481',
      downColor: '#EF4A3C',
      borderVisible: false,
      wickUpColor: '#00B481',
      wickDownColor: '#EF4A3C',
    });

    chartRef.current = chart;
    seriesRef.current = series;
    dataSetRef.current = false;

    const wsUrl = 'wss://exchange-ws1.bulk.trade';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: [{ type: 'candle', symbol, interval }]
      }));
    };

    chart.subscribeClick((param) => {
      if (!param.point || !param.sourceEvent?.altKey || !seriesRef.current) return;
      const series = seriesRef.current;
      const price = series.coordinateToPrice(param.point.y);
      if (price !== null) {
        series.createPriceLine({
          price: price,
          color: '#EAB308',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Line',
        });
      }
    });

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'candle' && msg.data && msg.data.candles) {
           const batch = msg.data.candles;
           const lwcData = batch.map((c: any) => ({
             time: Math.floor(Number(c.t) / 1000) as UTCTimestamp,
             open: parseFloat(c.o),
             high: parseFloat(c.h),
             low: parseFloat(c.l),
             close: parseFloat(c.c)
           })).sort((a: any, b: any) => a.time - b.time);

           if (!dataSetRef.current) {
             const uniqueData = Array.from(new Map(lwcData.map((item: any) => [item.time, item])).values()) as any[];
             series.setData(uniqueData);
             dataSetRef.current = true;
           } else {
             for (const c of lwcData) {
               try {
                 series.update(c);
               } catch (e) {
                 // ignore outdated ticks
               }
             }
           }
        }
      } catch (e) {}
    };

    const resizeObserver = new ResizeObserver(entries => {
      window.requestAnimationFrame(() => {
        if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, interval]);

  return (
    <div className="relative w-full h-full min-h-0">
      <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
      <div className="absolute bottom-2 left-2 pointer-events-none select-none px-2 py-1 bg-black/40 rounded-[2px] text-[10px] text-text-tertiary font-mono z-10 border border-white/5">
        Alt+Click to draw line
      </div>
    </div>
  );
}
