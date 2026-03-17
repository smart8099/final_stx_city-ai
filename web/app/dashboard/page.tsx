import Link from "next/link";
import { db } from "@/server/db";
import { tenants } from "@/server/db/schema";
import { asc } from "drizzle-orm";

export default async function DashboardIndexPage() {
  const allTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      isActive: tenants.isActive,
      websiteDomain: tenants.websiteDomain,
    })
    .from(tenants)
    .orderBy(asc(tenants.name));

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-3xl font-bold">CityAssist</h1>
      <p className="mb-8 text-muted-foreground">Select a tenant to manage</p>

      {allTenants.length === 0 ? (
        <p className="text-muted-foreground">
          No tenants found. Run <code className="rounded bg-muted px-1">make db-seed</code> to seed cities.
        </p>
      ) : (
        <ul className="space-y-3">
          {allTenants.map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/${t.slug}`}
                className="flex items-center justify-between rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.websiteDomain}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    t.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
