import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateAuditPdf } from '@/lib/pdf/generate';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { auditId?: string };
  try {
    body = (await req.json()) as { auditId?: string };
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!body.auditId) return NextResponse.json({ error: 'auditId required' }, { status: 400 });

  try {
    const result = await generateAuditPdf(createServiceClient(), body.auditId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'pdf generation failed' },
      { status: 500 },
    );
  }
}
