"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  useAuth,
  useUser,
  useOrganizationList,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Button,
  HStack,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { FiArrowRight, FiShield, FiClock } from "react-icons/fi";

export default function Home() {
  const { isSignedIn, isLoaded, orgSlug, orgId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  // If signed in AND has an active org, go to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && orgSlug) {
      router.push(`/dashboard/${orgSlug}/conversations`);
    }
  }, [isLoaded, isSignedIn, orgSlug, router]);

  // If signed in but no active org, auto-select the first org
  useEffect(() => {
    if (!isLoaded || !isSignedIn || orgId) return;
    if (!userMemberships?.data?.length) return;

    const firstOrg = userMemberships.data[0].organization;
    if (firstOrg && setActive) {
      setActive({ organization: firstOrg.id });
    }
  }, [isLoaded, isSignedIn, orgId, userMemberships?.data, setActive]);

  if (!isLoaded) {
    return (
      <Flex minH="100vh" bg="gray.50" align="center" justify="center">
        <Spinner color="blue.500" />
      </Flex>
    );
  }

  // Signed in but no org — waiting screen
  if (isSignedIn && !orgSlug) {
    return (
      <Flex minH="100vh" bg="gray.50" align="center" justify="center">
        <VStack spacing={6} maxW="420px" textAlign="center" px={6}>
          <VStack spacing={2}>
            <HStack spacing={2}>
              <Icon as={FiShield} boxSize={5} color="blue.500" />
              <Text fontSize="xl" fontWeight="700" color="gray.800">
                CityAssist
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Welcome, {user?.firstName || "there"}
            </Text>
          </VStack>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={6}
            w="100%"
          >
            <Flex
              w={12}
              h={12}
              bg="blue.50"
              borderRadius="full"
              align="center"
              justify="center"
              mx="auto"
              mb={4}
            >
              <Icon as={FiClock} boxSize={6} color="blue.500" />
            </Flex>
            <Text fontSize="md" fontWeight="600" color="gray.800" mb={1}>
              Waiting for access
            </Text>
            <Text fontSize="xs" color="gray.500" lineHeight="1.5">
              Your admin hasn't added you to an organization yet.
              Once they invite you, you'll be redirected to the dashboard automatically.
            </Text>
            <HStack justify="center" spacing={2} color="gray.400" mt={4}>
              <Spinner size="xs" color="blue.400" />
              <Text fontSize="xs">Checking for invitations...</Text>
            </HStack>
          </Box>

          <Text fontSize="xs" color="gray.400">
            Check your email for an invite link from your admin.
          </Text>
        </VStack>
      </Flex>
    );
  }

  // Signed in with org — will redirect (show nothing)
  if (isSignedIn) return null;

  // Not signed in — landing page
  return (
    <Flex minH="100vh" bg="gray.50" align="center" justify="center">
      <VStack spacing={8} maxW="400px" textAlign="center" px={6}>
        <VStack spacing={2}>
          <HStack spacing={2}>
            <Icon as={FiShield} boxSize={6} color="blue.500" />
            <Text fontSize="2xl" fontWeight="700" color="gray.800">
              CityAssist
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.500" lineHeight="1.6">
            AI-powered civic chatbot platform. Each city team manages their own
            knowledge base, departments, and conversations.
          </Text>
        </VStack>

        <SignedOut>
          <VStack spacing={3} w="100%">
            <SignInButton mode="modal">
              <Button
                w="100%"
                colorScheme="blue"
                size="md"
                rightIcon={<Icon as={FiArrowRight} />}
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button w="100%" variant="outline" size="md">
                Create Organization
              </Button>
            </SignUpButton>
          </VStack>
        </SignedOut>

        <Text fontSize="xs" color="gray.400">
          Multi-tenant authentication — each city accesses only their own data
        </Text>
      </VStack>
    </Flex>
  );
}
