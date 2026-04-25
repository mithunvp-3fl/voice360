import Link from 'next/link';
import { ClipboardList, Building2, FileCheck2, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r bg-white p-4 flex flex-col">
        <div className="font-semibold mb-6">VoiceOver360</div>
        <nav className="flex-1 space-y-1 text-sm">
          <NavLink href="/audits" icon={<ClipboardList size={16} />} label="Audits" />
          <NavLink href="/templates" icon={<FileCheck2 size={16} />} label="Templates" />
          <NavLink href="/vendors" icon={<Building2 size={16} />} label="Vendors" />
        </nav>
        <form action="/auth/signout" method="post" className="pt-4 border-t">
          <button className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black">
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100">
      {icon}
      {label}
    </Link>
  );
}
