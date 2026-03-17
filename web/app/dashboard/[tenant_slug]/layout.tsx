import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant_slug: string }>;
}

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const params = await props.params;

  const {
    children
  } = props;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar tenantSlug={params.tenant_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header tenantSlug={params.tenant_slug} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
