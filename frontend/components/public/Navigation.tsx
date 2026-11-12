'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <Link href="/" className="logo">
        <b>✝ School of Discipleship</b>
      </Link>
      <Link 
        href="/programme" 
        className={pathname === '/programme' ? 'active' : ''}
      >
        Curriculum
      </Link>
      <Link 
        href="/about" 
        className={pathname === '/about' ? 'active' : ''}
      >
        About
      </Link>
      <Link href="/login">Log in</Link>
      <Link href="/apply" className="btn">
        Enroll now
      </Link>
    </nav>
  );
}
