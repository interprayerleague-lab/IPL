'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="side adm">
      <h3>✝ Admin</h3>
      <Link href="/admin" className={isActive('/admin') && pathname === '/admin' ? 'act' : ''}>
        📊 Overview
      </Link>
      <Link href="/admin/students" className={isActive('/admin/students') ? 'act' : ''}>
        👥 Students
      </Link>
      <Link href="/admin/applications" className={isActive('/admin/applications') ? 'act' : ''}>
        🧭 Applications
      </Link>
      <Link href="/admin/enrollments" className={isActive('/admin/enrollments') ? 'act' : ''}>
        📚 Enrollments
      </Link>
      <Link href="/admin/content" className={isActive('/admin/content') ? 'act' : ''}>
        📝 Content
      </Link>
      <Link href="/admin/announcements" className={isActive('/admin/announcements') ? 'act' : ''}>
        📣 Announcements
      </Link>
      <Link href="/admin/payments" className={isActive('/admin/payments') ? 'act' : ''}>
        💳 Payments
      </Link>
      <Link href="/student">← Student view</Link>
      <a onClick={() => signOut()} style={{ cursor: 'pointer' }}>
        Log out
      </a>
    </aside>
  );
}
