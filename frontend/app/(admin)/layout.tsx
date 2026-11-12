import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <AdminSidebar />
      <div className="main" style={{ maxWidth: '1100px' }}>
        {children}
      </div>
    </div>
  );
}
