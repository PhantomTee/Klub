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

    // Fetch initial candles via REST endpoint as fallback
    fetch(`${process.env.NEXT_PUBLIC_BULK_HTTP || 'https://exchange-api.bulk.trade/api/v1'}/klines?symbol=${symbol}&interval=${interval}`)
      .then(res => res.json())
      .then(data => {
        if (!dataSetRef.current && data && data.length > 0) {
          const lwcData = data.map((c: any) => ({
            time: Math.floor(c.t / 1000) as UTCTimestamp,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c
          }));
          series.setData(lwcData);
          dataSetRef.current = true;
        }
      })
      .catch(console.error);

    const wsUrl = process.env.NEXT_PUBLIC_BULK_WS || 'wss://exchange-ws1.bulk.trade';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: [{ type: 'candle', symbol, interval }]
      }));
    };

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

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(pingInterval);
      ws.close();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, interval]);

  return (
    <div ref={chartContainerRef} className="w-full h-full min-h-[300px]" />
  );
}
