'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp, CandlestickSeries } from 'lightweight-charts';
import { useBulkMarkets } from '../../hooks/useBulkMarkets';

export function TradingChart({ symbol = 'BTC-USD', interval = '1m' }: { symbol?: string, interval?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { candles } = useBulkMarkets(symbol, interval);
  const dataSetRef = useRef(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#07070D' },
        textColor: '#8888AA',
      },
      grid: {
        vertLines: { color: '#1A1A2E' },
        horzLines: { color: '#1A1A2E' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22D3A5',
      downColor: '#F0524F',
      borderVisible: false,
      wickUpColor: '#22D3A5',
      wickDownColor: '#F0524F',
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
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, interval]);

  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      if (!dataSetRef.current || candles.length > 1) {
        // Full update
        const lwcData = candles.map((c) => ({
          time: Math.floor(c.t / 1000) as UTCTimestamp,
          open: c.o,
          high: c.h,
          low: c.l,
          close: c.c
        })).sort((a,b) => (a.time as number) - (b.time as number));
        // Ensure no duplicates
        const uniqueData = Array.from(new Map(lwcData.map(item => [item.time, item])).values());
        
        seriesRef.current.setData(uniqueData);
        dataSetRef.current = true;
      } else if (candles.length === 1) {
        // Single update
        const c = candles[0];
        try {
          seriesRef.current.update({
            time: Math.floor(c.t / 1000) as UTCTimestamp,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c
          });
        } catch (e) {
          // ignore time order assertions if ws sends outdated ticks
        }
      }
    }
  }, [candles]);

  return (
    <div ref={chartContainerRef} className="w-full h-full min-h-[300px]" />
  );
}
