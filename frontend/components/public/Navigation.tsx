'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/logo.jpg`;

  return (
    <nav className="nav">
      <Link href="/" className="logo">
        <Image 
          src={logoUrl}
          alt="School of Discipleship"
          width={40}
          height={40}
          priority
          style={{ borderRadius: '50%' }}
        />
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
    </nav>
  );
}
