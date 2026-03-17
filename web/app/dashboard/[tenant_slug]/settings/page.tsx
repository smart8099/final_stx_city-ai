interface SettingsPageProps {
  params: Promise<{ tenant_slug: string }>;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const _params = await props.params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Tenant Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Full settings management UI coming in Phase 2. Configure tenants via the backend API
            or directly in the database during Phase 1.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Widget Embed Code</h2>
          <code className="block rounded bg-muted px-4 py-3 text-sm">
            {`<script src="/static/widget.js" data-tenant="${_params.tenant_slug}" async></script>`}
          </code>
        </div>
      </div>
    </div>
  );
}
