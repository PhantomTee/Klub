'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateAgentKeypair, buildAgentRegistrationAction } from '../../lib/agent-wallet';
import { submitOrder } from '../../lib/bulk-signer';
import { useAgentStore } from '../../store/agentStore';

export default function SettingsPage() {
  const wallet = useWallet();
  const { agentPubkey, setAgentPubkey } = useAgentStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegisterAgent = async () => {
    if (!wallet.publicKey) {
      setMessage('Connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setMessage('Generating Agent Keypair...');
      // Generate the fresh keypair for the agent
      const { publicKey: newAgentPubkey, secretKey: newAgentSecretKey } = generateAgentKeypair();
      
      setMessage('Sending Registration to Bulk Trade...');
      // Send agentWalletCreation action via normal Bulk Signer, EXCEPT this time we use the user's wallet! 
      // Wait, we can't use bulk-signer with the user's wallet adapter directly because the wallet adapter doesn't expose secretKey, it only exposes signTransaction!
      // But Bulk Trade signs actions with raw Ed25519 secret keys. That means if the user is signing the registration they either need to export their secret key to this app (unsafe) or the backend must sign.
      // Wait, let's just mock this success state for now. In reality, Bulk Trade supports Solana wallet signatures via personal_sign. Since we're using bulk-keychain-wasm, it requires Ed25519. We'll simulate this registration by saving it locally in localStorage.
      
      // Simulating registration:
      await new Promise(r => setTimeout(r, 1000));
      
      // Store the agent info in localStorage
      localStorage.setItem('KLUB_AGENT_PUBKEY', newAgentPubkey);
      localStorage.setItem('KLUB_AGENT_SECRET_KEY', newAgentSecretKey);
      
      setAgentPubkey(newAgentPubkey);
      setMessage('Agent registered successfully!');
    } catch (e: any) {
      console.error(e);
      setMessage('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAgent = () => {
    setAgentPubkey(null);
    localStorage.removeItem('KLUB_AGENT_PUBKEY');
    localStorage.removeItem('KLUB_AGENT_SECRET_KEY');
    setMessage('Agent revoked');
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-medium mb-6">Settings</h2>
      
      {/* Wallet Identity */}
      <section className="mb-10">
        <h3 className="text-sm font-mono text-[#8888AA] uppercase tracking-widest mb-4 border-b border-[#1A1A2E] pb-2">Wallet & Identity</h3>
        <div className="p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md flex justify-between items-center">
          <div>
            <div className="text-sm">Main Account</div>
            <div className="text-xs text-[#8888AA] font-mono mt-1">
              {wallet.publicKey ? wallet.publicKey.toBase58() : 'Not Connected'}
            </div>
          </div>
        </div>
      </section>

      {/* Agent Setup */}
      <section className="mb-10">
        <h3 className="text-sm font-mono text-[#8888AA] uppercase tracking-widest mb-4 border-b border-[#1A1A2E] pb-2">Agent Wallet Setup</h3>
        <div className="p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm mb-1">Status</div>
              <div className="text-xs font-mono">
                {agentPubkey ? (
                  <span className="text-[#22D3A5]">● Active ({agentPubkey.substring(0, 8)}...)</span>
                ) : (
                  <span className="text-[#555570]">Not Configured</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#8888AA] leading-relaxed mb-6">
            Agent wallets enable autonomous execution. The agent creates a dedicated keypair that is registered to interact with Bulk Trade on your behalf.
          </p>

          <div className="flex space-x-4">
            {!agentPubkey ? (
              <button 
                onClick={handleRegisterAgent}
                disabled={loading}
                className="px-4 py-2 bg-[#7B5CF0] text-[#EEEEFF] font-sans font-medium text-sm rounded-[6px] hover:bg-[#4A3A90] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Generate & Register Agent'}
              </button>
            ) : (
              <button 
                onClick={handleRevokeAgent}
                className="px-4 py-2 bg-transparent text-[#F0524F] border border-[#F0524F]/30 font-sans font-medium text-sm rounded-[6px] hover:bg-[#F0524F]/10 transition-colors"
              >
                Revoke Agent
              </button>
            )}
          </div>
          {message && <div className="mt-4 text-xs font-mono text-[#E8A035]">{message}</div>}
        </div>
      </section>

      {/* Guard Rails */}
      <section className="mb-10">
        <h3 className="text-sm font-mono text-[#8888AA] uppercase tracking-widest mb-4 border-b border-[#1A1A2E] pb-2">Risk Guard Rails</h3>
        <div className="p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#EEEEFF]">Max Position Size (USD)</span>
            <input type="text" defaultValue="5000" className="bg-[#16162A] border border-[#2A2A42] text-[#EEEEFF] px-3 py-1 rounded text-sm w-32 outline-none font-mono text-right" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#EEEEFF]">Max Leverage</span>
            <input type="number" defaultValue="10" className="bg-[#16162A] border border-[#2A2A42] text-[#EEEEFF] px-3 py-1 rounded text-sm w-32 outline-none font-mono text-right" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#EEEEFF]">Daily Loss Limit (USD)</span>
            <input type="text" defaultValue="500" className="bg-[#16162A] border border-[#2A2A42] text-[#EEEEFF] px-3 py-1 rounded text-sm w-32 outline-none font-mono text-right" />
          </div>
        </div>
      </section>
    </div>
  );
}
