'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/student' && pathname === '/student') return true;
    if (path !== '/student' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="side">
      <h3>✝ Discipleship</h3>
      <Link
        href="/student"
        className={isActive('/student') && pathname === '/student' ? 'act' : ''}
      >
        🏠 Dashboard
      </Link>
      <Link
        href="/student/learning"
        className={isActive('/student/learning') ? 'act' : ''}
      >
        ▶ My course
      </Link>
      <Link
        href="/student/application"
        className={isActive('/student/application') ? 'act' : ''}
      >
        📋 Application
      </Link>
      <Link
        href="/student/announcements"
        className={isActive('/student/announcements') ? 'act' : ''}
      >
        📣 Announcements
      </Link>
      <Link
        href="/student/profile"
        className={isActive('/student/profile') ? 'act' : ''}
      >
        👤 Profile
      </Link>
      <a onClick={() => signOut()} style={{ cursor: 'pointer' }}>
        Log out
      </a>
    </aside>
  );
}
