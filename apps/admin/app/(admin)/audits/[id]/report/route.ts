import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';
import { generateAuditPdf } from '@/lib/pdf/generate';

export const runtime = 'nodejs';

const REPORT_BUCKET = 'reports';
const SIGNED_URL_TTL = 60 * 5; // short — admin streams it through

/**
 * Returns a signed URL (302 redirect) for the audit's PDF, generating it
 * on-demand if missing. Admin-only via cookie session.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const userClient = await createClient();
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data: audit, error } = await sb
    .from('audits')
    .select('id, report_path')
    .eq('id', id)
    .maybeSingle();
  if (error || !audit) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let path = audit.report_path as string | null;
  if (!path) {
    try {
      const result = await generateAuditPdf(sb, id);
      path = result.reportPath;
    } catch (err: any) {
      return NextResponse.json({ error: err?.message ?? 'pdf failed' }, { status: 500 });
    }
  }

  const { data: signed } = await sb.storage
    .from(REPORT_BUCKET)
    .createSignedUrl(path!, SIGNED_URL_TTL);

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: 'could not sign url' }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
