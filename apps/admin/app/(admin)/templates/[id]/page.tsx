import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface SectionRow {
  id: string;
  name: string;
  display_order: number;
  questions: { id: string; text: string; is_mandatory: boolean; display_order: number }[];
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('checklist_templates')
    .select('id, name, industry, version, is_active')
    .eq('id', id)
    .maybeSingle();

  if (!template) notFound();

  const { data: sections } = await supabase
    .from('checklist_sections')
    .select(
      'id, name, display_order, questions:checklist_questions(id, text, is_mandatory, display_order)',
    )
    .eq('template_id', id)
    .order('display_order')
    .returns<SectionRow[]>();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">{template.industry}</div>
        <h1 className="text-2xl font-semibold">{template.name}</h1>
        <div className="text-sm text-neutral-500">
          v{template.version} · {template.is_active ? 'active' : 'inactive'}
        </div>
      </div>

      {(sections ?? []).map((s) => (
        <section key={s.id} className="bg-white rounded border">
          <header className="px-4 py-3 border-b bg-neutral-50">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Section {s.display_order}
            </div>
            <div className="font-medium">{s.name}</div>
          </header>
          <ol className="divide-y">
            {[...s.questions]
              .sort((a, b) => a.display_order - b.display_order)
              .map((q) => (
                <li key={q.id} className="px-4 py-3 text-sm flex items-start gap-3">
                  <span className="text-neutral-400 w-6">{q.display_order}.</span>
                  <div className="flex-1">
                    <div>{q.text}</div>
                    {!q.is_mandatory && (
                      <div className="text-xs text-neutral-500 mt-1">optional</div>
                    )}
                  </div>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
