interface OverviewPageProps {
  params: Promise<{ tenant_slug: string }>;
}

export default async function OverviewPage(props: OverviewPageProps) {
  const params = await props.params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Tenant</p>
          <p className="mt-1 text-2xl font-semibold">{params.tenant_slug}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">Active</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Phase</p>
          <p className="mt-1 text-2xl font-semibold">1 — Web Search</p>
        </div>
      </div>
      <p className="mt-8 text-muted-foreground">
        Full analytics and conversation history coming in Phase 2.
      </p>
    </div>
  );
}
