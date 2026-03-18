"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Flex, Spinner } from "@chakra-ui/react";

export default function DashboardIndexPage() {
  const { orgSlug, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
      return;
    }
    if (orgSlug) {
      router.replace(`/dashboard/${orgSlug}/conversations`);
    } else {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, orgSlug, router]);

  return (
    <Flex minH="100vh" align="center" justify="center">
      <Spinner color="blue.500" />
    </Flex>
  );
}
