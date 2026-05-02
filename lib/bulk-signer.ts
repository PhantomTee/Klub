import init, { WasmSigner } from 'bulk-keychain-wasm';
import bs58 from 'bs58';

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export async function submitOrder({
  actions,
  account,
  signer,
  signerSecretKey
}: {
  actions: any[],
  account: string,
  signer: string,
  signerSecretKey: Uint8Array
}) {
  await ensureInit();
  
  const signerWasm = WasmSigner.fromBase58(bs58.encode(signerSecretKey));
  const nonce = Date.now() * 1000; // microseconds usually enough for nonce manager or manual
  
  // Prepare full transaction payload using the WASM signer
  // Based on the WASM structure: signEntries or sign
  // Often 'signOrder' or 'signGroup' for multiple.
  const response = signerWasm.signGroup(actions, nonce);
  
  const body = {
    method: 'order',
    params: {
      account,
      signer,
      nonce: nonce.toString(),
      signature: response.signature,
      actions
    }
  };

  const exchangeUrl = process.env.NEXT_PUBLIC_BULK_HTTP || 'https://exchange-api.bulk.trade/api/v1';
  const res = await fetch(`${exchangeUrl}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Exchange error: ${errText}`);
  }

  return res.json();
}
