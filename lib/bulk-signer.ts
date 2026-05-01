import { WasmSigner } from 'bulk-keychain-wasm';
import bs58 from 'bs58';

export async function submitOrder(params: {
  actions: any[];
  account: string;
  signer: string;
  signerSecretKey: Uint8Array;
}): Promise<any> {
  const secretString = bs58.encode(params.signerSecretKey);
  const signer = WasmSigner.fromBase58(secretString);
  const nonce = Date.now() * 1000000;
  
  // The signGroup creates a single payload. It returns an object that has the signature.
  // We'll trust what it outputs based on its definitions.
  // Actually, signGroup directly returns the signed transaction object
  const signedPayload = signer.signGroup(params.actions, nonce);
  
  const payloadToSubmit = {
    ...signedPayload,
    account: params.account,
    signer: params.signer,
  };
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BULK_HTTP || 'https://exchange-api.bulk.trade/api/v1'}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadToSubmit)
  });
  
  return response.json();
}
