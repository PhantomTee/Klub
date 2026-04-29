import { WasmSigner } from 'bulk-keychain-wasm';
import bs58 from 'bs58';

export async function signBulkTransaction(
  actions: any[],
  nonce: bigint,
  accountPubkey: string,
  signerSecretKey: Uint8Array
): Promise<any> {
  const secretString = bs58.encode(signerSecretKey);
  const signer = WasmSigner.fromBase58(secretString);
  // It appears wait, the bulk-keychain-wasm expects a specific payload format for operations.
  // The signAll takes an array of actions and a numerical nonce.
  // We'll approximate this based on the existing signature:
  return signer.signAll(actions, Number(nonce));
}
