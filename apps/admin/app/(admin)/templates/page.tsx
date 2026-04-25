import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('id, name, industry, version, is_active, created_at')
    .order('industry');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Checklist Templates</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(templates ?? []).map((t) => (
          <Link
            href={`/templates/${t.id}`}
            key={t.id}
            className="bg-white rounded border p-4 hover:shadow-sm transition"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">{t.industry}</div>
            <div className="font-medium mt-1">{t.name}</div>
            <div className="text-xs text-neutral-500 mt-2">
              v{t.version} · {t.is_active ? 'active' : 'inactive'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
