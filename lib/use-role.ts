"use client";

import { useOrganization } from "@clerk/nextjs";

export function useIsAdmin() {
  const { membership } = useOrganization();
  const role = membership?.role;
  return role === "org:admin";
}
