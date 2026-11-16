import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/logo.jpg`;

export const metadata: Metadata = {
  title: "School of Discipleship | Deepen Your Walk with Christ",
  description: "A 12-week intensive discipleship program combining biblical teaching, mentorship, and community. Learn foundations of faith, the Holy Spirit, and Christian disciplines.",
  icons: {
    icon: logoUrl,
    apple: logoUrl,
  },
  openGraph: {
    title: "School of Discipleship",
    description: "Deepen your walk with Christ through intensive biblical teaching and mentorship",
    images: [logoUrl],
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
