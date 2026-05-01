import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export function generateAgentKeypair(): { publicKey: string; secretKey: string } {
  const kp = Keypair.generate();
  return {
    publicKey: bs58.encode(kp.publicKey.toBytes()),
    secretKey: bs58.encode(kp.secretKey)
  };
}

export function buildAgentRegistrationAction(agentPubkey: string, remove = false) {
  return { agentWalletCreation: { a: agentPubkey, d: remove } };
}
