"use client";

import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  Link as ChakraLink,
  HStack,
} from "@chakra-ui/react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import NextLink from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiBook,
  FiUsers,
  FiMessageSquare,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";


const NAV_ITEMS = [
  { label: "Knowledge Base", href: "/knowledge-base", icon: FiBook },
  { label: "Departments", href: "/departments", icon: FiUsers },
  { label: "Conversations", href: "/conversations", icon: FiMessageSquare },
  { label: "Analytics", href: "/analytics", icon: FiBarChart2 },
  { label: "Settings", href: "/settings", icon: FiSettings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { orgSlug, orgRole, isLoaded, isSignedIn } = useAuth();
  const slug = params.tenant_slug as string;
  const roleLabel = orgRole === "org:admin" || orgRole === "org:organization_city_admin" ? "Organization/City Admin" : orgRole === "org:tech_admin" ? "Tech Admin" : orgRole ? "Member" : "";
  const basePath = `/dashboard/${slug}`;

  // Redirect if org changes or slug doesn't match
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
      return;
    }
    if (orgSlug && slug !== orgSlug) {
      const newPath = pathname.replace(`/dashboard/${slug}`, `/dashboard/${orgSlug}`);
      router.replace(newPath);
    }
  }, [isLoaded, isSignedIn, orgSlug, slug, pathname, router]);

  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Box
        w="240px"
        bg="gray.900"
        color="white"
        flexShrink={0}
        display="flex"
        flexDirection="column"
      >
        {/* Logo + Org */}
        <Box px={5} py={5} borderBottom="1px solid" borderColor="gray.700">
          <Text fontSize="xl" fontWeight="bold" color="blue.300" mb={2}>
            CityAssist
          </Text>
          <SignedIn>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Organization
            </Text>
            <OrganizationSwitcher
              hidePersonal
              hideSlug
              createOrganizationMode="navigation"
              createOrganizationUrl="/disabled"
              organizationProfileMode="modal"
              appearance={{
                elements: {
                  rootBox: { width: "100%" },
                  organizationSwitcherTrigger: {
                    color: "#a0aec0",
                    fontSize: "12px",
                    padding: "4px 0",
                  },
                  organizationSwitcherPopoverActionButton__createOrganization: {
                    display: "none",
                  },
                  organizationSwitcherPopoverActionButton__manageOrganization: {
                    display: orgRole === "org:admin" || orgRole === "org:organization_city_admin" ? "flex" : "none",
                  },
                  organizationSwitcherTriggerIcon: {
                    display: "none",
                  },
                  organizationPreviewMainIdentifier: {
                    fontSize: "13px",
                    fontWeight: "600",
                  },
                  organizationPreviewSecondaryIdentifier: {
                    display: "none",
                  },
                },
              }}
            />
            {roleLabel && (
              <Text fontSize="11px" color="gray.400" mt={0.5}>
                {roleLabel}
              </Text>
            )}
          </SignedIn>
          <SignedOut>
            <Text fontSize="xs" color="gray.400">
              Not signed in
            </Text>
          </SignedOut>
        </Box>

        {/* Nav Links */}
        <VStack spacing={1} align="stretch" px={3} py={4} flex={1}>
          {NAV_ITEMS.map((item) => {
            const fullPath = `${basePath}${item.href}`;
            const isActive = pathname.startsWith(fullPath);
            return (
              <ChakraLink
                as={NextLink}
                key={item.href}
                href={fullPath}
                display="flex"
                alignItems="center"
                gap={3}
                px={3}
                py={2.5}
                borderRadius="md"
                fontSize="sm"
                fontWeight={isActive ? "600" : "400"}
                bg={isActive ? "blue.600" : "transparent"}
                color={isActive ? "white" : "gray.300"}
                _hover={{
                  bg: isActive ? "blue.600" : "gray.800",
                  color: "white",
                  textDecoration: "none",
                }}
                transition="all 0.15s"
              >
                <Icon as={item.icon} boxSize={4} />
                {item.label}
              </ChakraLink>
            );
          })}
        </VStack>

        {/* User */}
        <Box px={5} py={4} borderTop="1px solid" borderColor="gray.700">
          <SignedIn>
            <HStack spacing={3}>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: { width: "28px", height: "28px" },
                  },
                }}
              />
              {orgRole === "org:tech_admin" && (
                <style>{`
                  .cl-navbarButton__security,
                  .cl-navbarButton__danger,
                  .cl-profileSection__activeDevices,
                  .cl-profileSection__danger,
                  .cl-profilePage__security,
                  [data-localization-key="userProfile.start.dangerSection.title"],
                  [data-localization-key="userProfile.start.dangerSection.deleteAccountButton"] {
                    display: none !important;
                  }
                `}</style>
              )}
            </HStack>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Text
                fontSize="xs"
                color="blue.300"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
              >
                Sign in
              </Text>
            </SignInButton>
          </SignedOut>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flex={1} overflow="auto" bg="white">
        {children}
      </Box>
    </Flex>
  );
}
