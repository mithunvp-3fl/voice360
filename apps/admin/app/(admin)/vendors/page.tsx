import { createClient } from '@/lib/supabase/server';

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, name, type, address, contact_name, contact_phone')
    .order('name');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Vendors</h1>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <div className="bg-white rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {(vendors ?? []).map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2 font-medium">{v.name}</td>
                <td className="px-4 py-2 text-neutral-600">{v.type}</td>
                <td className="px-4 py-2 text-neutral-600">{v.address}</td>
                <td className="px-4 py-2 text-neutral-600">
                  {v.contact_name}
                  {v.contact_phone ? ` · ${v.contact_phone}` : ''}
                </td>
              </tr>
            ))}
            {(!vendors || vendors.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No vendors yet. Run the seed script to populate demo data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
