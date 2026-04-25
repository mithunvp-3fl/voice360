import { createClient } from '@/lib/supabase/server';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-neutral-100 text-neutral-700',
  in_progress: 'bg-amber-100 text-amber-800',
  draft: 'bg-blue-100 text-blue-800',
  submitted: 'bg-green-100 text-green-800',
};

export default async function AuditsPage() {
  const supabase = await createClient();
  const { data: audits } = await supabase
    .from('audits')
    .select(
      'id, status, scheduled_at, submitted_at, report_path, vendor:vendors(name), template:checklist_templates(name, industry), auditor:users(name)',
    )
    .order('scheduled_at', { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audits</h1>
      <div className="bg-white rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">Template</th>
              <th className="px-4 py-2">Auditor</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Scheduled</th>
              <th className="px-4 py-2">Report</th>
            </tr>
          </thead>
          <tbody>
            {(audits ?? []).map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2 font-medium">{a.vendor?.name ?? '—'}</td>
                <td className="px-4 py-2 text-neutral-600">
                  {a.template?.name}
                  <span className="text-xs text-neutral-400 ml-2">{a.template?.industry}</span>
                </td>
                <td className="px-4 py-2 text-neutral-600">{a.auditor?.name ?? '—'}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[a.status] ?? 'bg-neutral-100'}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-600">
                  {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-2">
                  {a.status === 'submitted' ? (
                    <a
                      href={`/audits/${a.id}/report`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {a.report_path ? 'Download PDF' : 'Generate PDF'}
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {(!audits || audits.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No audits yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
