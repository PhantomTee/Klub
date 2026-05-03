let loaded = false;
let promise: Promise<void> | null = null;

export function loadTradingView(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (promise) return promise;
  promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/charting_library/charting_library.js";
    script.onload = () => { loaded = true; resolve(); };
    script.onerror = () => {
      console.warn("Failed to load local TradingView library. Make sure public/charting_library exists.");
      reject(new Error("TradingView not found"));
    };
    document.head.appendChild(script);
  });
  return promise;
}
