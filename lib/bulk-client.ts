const HTTP_BASE = process.env.NEXT_PUBLIC_BULK_HTTP || 'https://testnet-api.bulk.trade/api/v1';

export async function fetchExchangeInfo() {
  const res = await fetch(`${HTTP_BASE}/exchangeInfo`);
  if (!res.ok) throw new Error('Failed to fetch exchange info');
  return res.json();
}

export async function fetchKlines(symbol: string, interval: string) {
  const res = await fetch(`${HTTP_BASE}/klines?symbol=${symbol}&interval=${interval}`);
  if (!res.ok) throw new Error('Failed to fetch klines');
  return res.json();
}

export async function fetchTicker(symbol: string) {
  const res = await fetch(`${HTTP_BASE}/ticker/${symbol}`);
  if (!res.ok) throw new Error('Failed to fetch ticker');
  return res.json();
}

export async function fetchL2Book(symbol: string) {
  const res = await fetch(`${HTTP_BASE}/l2book?symbol=${symbol}`);
  if (!res.ok) throw new Error('Failed to fetch l2book');
  return res.json();
}

export async function fetchAccount(userPubkey: string) {
  const res = await fetch(`${HTTP_BASE}/account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'fullAccount', user: userPubkey })
  });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}
