import { NextResponse } from 'next/server';
import { signBulkTransaction } from '../../../lib/bulk-signer';
import bs58 from 'bs58';

export async function POST(req: Request) {
  try {
    const { actions, account } = await req.json();
    
    if (!actions || !account) {
      return NextResponse.json({ error: 'Missing actions or account' }, { status: 400 });
    }

    const privateKeyStr = process.env.KLUB_AGENT_PRIVATE_KEY;
    const pubKeyStr = process.env.KLUB_AGENT_PUBLIC_KEY;

    if (!privateKeyStr || !pubKeyStr) {
      return NextResponse.json({ error: 'Agent wallet not configured on server' }, { status: 500 });
    }

    const secretKeyHex = bs58.decode(privateKeyStr);
    const nonce = BigInt(Date.now()) * 1_000_000n;
    
    const signature = await signBulkTransaction(actions, nonce, account, secretKeyHex);

    const HTTP_BASE = process.env.NEXT_PUBLIC_BULK_HTTP || 'https://testnet-api.bulk.trade/api/v1';
    
    const response = await fetch(`${HTTP_BASE}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actions,
        nonce: nonce.toString(),
        account,
        signer: pubKeyStr,
        signature
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Execution error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
