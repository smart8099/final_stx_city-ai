import { redirect } from "next/navigation";

export default function DashboardPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  redirect(`/dashboard/${params.tenant_slug}/conversations`);
}
