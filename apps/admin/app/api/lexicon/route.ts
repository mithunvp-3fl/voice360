import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { DEFAULT_LEXICON } from '@vo360/shared';

/** Mobile fetches this on launch; falls back to bundled DEFAULT_LEXICON if offline. */
export async function GET() {
  const sb = createServiceClient();
  const { data } = await sb.from('lexicon').select('verdict, keywords, updated_at');

  if (!data || data.length === 0) {
    return NextResponse.json({ source: 'fallback', lexicon: DEFAULT_LEXICON });
  }

  const lexicon: Record<string, string[]> = {};
  for (const row of data) {
    lexicon[row.verdict] = row.keywords;
  }
  return NextResponse.json({ source: 'remote', lexicon });
}
