import { NextResponse } from 'next/server';
import { parseIntentWithAI } from '../../../lib/openrouter';

export async function POST(req: Request) {
  try {
    const { intent } = await req.json();
    if (!intent) {
      return NextResponse.json({ error: 'Intent is required' }, { status: 400 });
    }

    const plan = await parseIntentWithAI(intent);
    
    // Auto-generate UUIDs for legs if missing
    if (plan.legs) {
      plan.legs.forEach((leg: any, i: number) => {
        if (!leg.id) leg.id = `leg_${Date.now()}_${i}`;
        leg.status = 'queued';
      });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Intent parsing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
