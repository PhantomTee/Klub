import { NextResponse } from 'next/server';
import { submitOrder } from '../../../lib/bulk-signer';
import bs58 from 'bs58';

export async function POST(req: Request) {
  try {
    const { actions, account, environment } = await req.json();
    
    if (!actions || !account) {
      return NextResponse.json({ error: 'Missing actions or account' }, { status: 400 });
    }

    const privateKeyStr = process.env.KLUB_AGENT_PRIVATE_KEY;
    const pubKeyStr = process.env.KLUB_AGENT_PUBLIC_KEY;

    if (!privateKeyStr || !pubKeyStr) {
      return NextResponse.json({ error: 'Agent wallet not configured on server' }, { status: 500 });
    }

    const secretKeyArray = bs58.decode(privateKeyStr);
    
    const decoratedActions = actions.map((a: any) => {
      // Embed PFOF Referral code
      const tag = process.env.BULK_REFERRAL_CODE;
      if (tag) {
        if (a.m) return { m: { ...a.m, t: tag } };
        if (a.l) return { l: { ...a.l, t: tag } };
      }
      return a;
    });

    const data = await submitOrder({
      actions: decoratedActions,
      account,
      signer: pubKeyStr,
      signerSecretKey: secretKeyArray,
      environment
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Execution error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
