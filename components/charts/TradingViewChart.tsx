"use client";

import { useEffect, useRef, useState } from "react";
import { loadTradingView } from "../../lib/tv-loader";
import { BulkTVDatafeed } from "../../lib/bulk-tv-datafeed";

interface TradingViewChartProps {
  symbol: string;
  walletPubkey?: string;
  openOrders?: any[];
  openPositions?: any[];
  onSymbolChange?: (symbol: string) => void;
  height?: number | string;
}

export default function TradingViewChart({
  symbol,
  walletPubkey,
  openOrders = [],
  openPositions = [],
  onSymbolChange,
  height = "100%",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const datafeedRef = useRef<BulkTVDatafeed | null>(null);
  const [priceMode, setPriceMode] = useState<"mark" | "oracle">("oracle");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadTradingView()
      .then(() => {
        if (!mounted || !containerRef.current) return;
        
        datafeedRef.current = new BulkTVDatafeed(priceMode);

        const widgetOptions = {
          datafeed: datafeedRef.current,
          symbol: symbol,
          interval: "5",
          container: containerRef.current,
          library_path: "/charting_library/",
          locale: "en",
          timezone: "exchange" as const,
          enabled_features: [
            "study_templates",
            "use_localstorage_for_settings",
            "save_chart_properties_to_local_storage",
            "side_toolbar_in_fullscreen_mode",
            "header_in_fullscreen_mode",
            "items_favoriting",
            "show_object_tree",
            "drawing_templates",
          ],
          disabled_features: [
            "header_symbol_search",
            "header_compare",
            "display_market_status",
            "go_to_date",
            "show_interval_dialog_on_key_press",
            "header_undo_redo",
          ],
          overrides: {
            "paneProperties.background": "#131210", // Matching klub background
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "#1A1A2E",
            "paneProperties.horzGridProperties.color": "#1A1A2E",
            "paneProperties.crossHairProperties.color": "#7B5CF0",
            "paneProperties.crossHairProperties.width": 1,
            "mainSeriesProperties.candleStyle.upColor": "#22D3A5",
            "mainSeriesProperties.candleStyle.downColor": "#F0524F",
            "mainSeriesProperties.candleStyle.drawWick": true,
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": "#22D3A5",
            "mainSeriesProperties.candleStyle.borderDownColor": "#F0524F",
            "mainSeriesProperties.candleStyle.wickUpColor": "#22D3A5",
            "mainSeriesProperties.candleStyle.wickDownColor": "#F0524F",
            "scalesProperties.textColor": "#8888AA",
            "scalesProperties.fontSize": 11,
            "scalesProperties.lineColor": "#2A2A42",
          },
          custom_css_url: "/charting_library-dark.css",
          charts_storage_url: undefined,
          client_id: "klub.trade",
          user_id: walletPubkey ?? "anonymous",
          fullscreen: false,
          autosize: true,
        };

        const tvWidget = new (window as any).TradingView.widget(widgetOptions);

        tvWidget.onChartReady(() => {
          if (!mounted) return;
          tvWidget.chart().createStudy(
            "Moving Average",
            false,
            false,
            { length: 1, source: "close" },
            { "Plot.color": "#7B5CF0", "Plot.linewidth": 1 },
            { showStudyArguments: false }
          );
          widgetRef.current = tvWidget;
          setReady(true);
        });
      })
      .catch((e) => {
        console.error("TradingView load error:", e);
        if (mounted) setLoadError(true);
      });

    return () => {
      mounted = false;
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [symbol]);

  useEffect(() => {
    if (!ready || !widgetRef.current) return;
    const chart = widgetRef.current.chart();
    
    // Minimal mock for orders/positions based on prompt step 5 and 6
    // Since we don't have persistence implemented here, we just run the mock layout
    openOrders.forEach(order => {
      try {
        const line = chart.createOrderLine()
          .setTooltip(order.orderType || 'Limit')
          .setModifyTooltip("Modify")
          .setCancelTooltip("Cancel")
          .onCancel(() => {
             console.log("Cancel order", order.id);
          })
          .setLineLength(3)
          .setLineColor(order.isBuy ? "#22D3A5" : "#F0524F")
          .setBodyBackgroundColor(order.isBuy ? "#22D3A5" : "#F0524F")
          .setBodyTextColor("#07070D")
          .setQuantity(order.size.toString())
          .setQuantityTextColor("#07070D")
          .setQuantityBackgroundColor(order.isBuy ? "#22D3A5" : "#F0524F")
          .setPrice(order.price);
      } catch (e) {}
    });

    openPositions.forEach(position => {
      try {
        const positionLine = chart.createPositionLine()
          .setTooltip(`Entry: ${position.price}`)
          .setLineColor("#7B5CF0")
          .setBodyBackgroundColor("#7B5CF0")
          .setBodyTextColor("#FFFFFF")
          .setQuantity(`${position.size > 0 ? "L" : "S"} ${Math.abs(position.size)}`)
          .setQuantityBackgroundColor("#7B5CF0")
          .setQuantityTextColor("#FFFFFF")
          .setPrice(position.price);

        if (position.liquidationPrice) {
          chart.createOrderLine()
            .setPrice(position.liquidationPrice)
            .setLineColor("#F0524F")
            .setLineStyle(2)
            .setBodyText("LIQ")
            .setBodyBackgroundColor("#F0524F")
            .setBodyTextColor("#FFFFFF");
        }
      } catch (e) {}
    });
  }, [openOrders, openPositions, ready]);

  const handlePriceModeChange = (mode: "mark" | "oracle") => {
    setPriceMode(mode);
    datafeedRef.current?.setPriceMode(mode);
    if (widgetRef.current) {
       widgetRef.current.chart().resetData();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height }}>
      {loadError && (
        <div className="absolute inset-0 z-50 bg-[#131210] flex items-center justify-center text-text-tertiary flex-col p-8 text-center text-[12px] font-mono">
          <svg className="w-8 h-8 mb-4 text-[#F0524F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <p className="mb-2 text-white">TradingView Advanced Charting Library not found</p>
          <p className="max-w-md text-[#8888AA]">The charting_library is a private repo and must be added to /public/charting_library/ manually. Apply for free access at tradingview.com.</p>
        </div>
      )}
      
      {!loadError && (
        <div className="flex gap-2 p-2 px-4 shadow-sm z-10 absolute top-0 right-0">
          <div className="flex bg-[#0F0F1A] rounded p-0.5 border border-border">
            <button 
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-colors ${priceMode === "mark" ? "bg-[#1E1E32] text-[#EEEEFF]" : "text-[#8888AA] hover:text-[#EEEEFF]"}`}
              onClick={() => handlePriceModeChange("mark")}
            >
              Mark
            </button>
            <button
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-colors ${priceMode === "oracle" ? "bg-[#1E1E32] text-[#EEEEFF]" : "text-[#8888AA] hover:text-[#EEEEFF]"}`}
              onClick={() => handlePriceModeChange("oracle")}
            >
              Oracle
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} className={loadError ? "hidden" : "block"} />
    </div>
  );
}
