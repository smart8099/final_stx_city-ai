interface DepartmentsPageProps {
  params: { tenant_slug: string };
}

export default function DepartmentsPage({ params: _params }: DepartmentsPageProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Departments</h1>
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-lg font-medium text-muted-foreground">No departments configured yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Departments are used for escalation routing. Seed them via SQL in Phase 1.
        </p>
      </div>
    </div>
  );
}
