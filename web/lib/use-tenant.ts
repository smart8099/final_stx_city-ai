"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc";

/**
 * Resolves the current tenant by slug. Auto-provisions a new tenant row
 * in the database if one doesn't exist yet for this Clerk organization.
 */
export function useTenant() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { organization } = useOrganization();

  const ensureTenant = trpc.tenants.getOrCreateBySlug.useMutation();
  const [tenant, setTenant] = useState<{
    id: string;
    slug: string;
    name: string;
    websiteDomain: string;
    apiKey: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug && !tenant && !ensureTenant.isPending) {
      ensureTenant.mutate(
        { slug, orgName: organization?.name },
        {
          onSuccess: (data) => setTenant(data),
          onError: (err) => setError(err.message),
        },
      );
    }
  }, [slug, organization?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tenant,
    tenantId: tenant?.id ?? null,
    slug,
    isLoading: !tenant && !error,
    error,
  };
}
