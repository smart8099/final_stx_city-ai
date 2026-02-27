"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Button,
  HStack,
  Icon,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { FiArrowRight, FiShield, FiMail, FiCheck, FiClock } from "react-icons/fi";

export default function Home() {
  const { isSignedIn, isLoaded, orgSlug, orgId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [orgEmail, setOrgEmail] = useState("");
  const [requested, setRequested] = useState(false);

  // If signed in AND has an org, go to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && orgSlug) {
      router.push(`/dashboard/${orgSlug}/conversations`);
    }
  }, [isLoaded, isSignedIn, orgSlug, router]);

  // Poll for org membership if signed in but no org
  useEffect(() => {
    if (!isLoaded || !isSignedIn || orgId) return;
    const interval = setInterval(() => {
      // Clerk auto-updates orgId when user accepts invite
      // This effect will re-run and redirect when orgSlug appears
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, orgId]);

  if (!isLoaded) {
    return (
      <Flex minH="100vh" bg="gray.50" align="center" justify="center">
        <Spinner color="blue.500" />
      </Flex>
    );
  }

  // Signed in but no org — onboarding screen
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

          {!requested ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="xl"
              p={6}
              w="100%"
            >
              <Icon as={FiMail} boxSize={8} color="blue.400" mb={3} />
              <Text fontSize="md" fontWeight="600" color="gray.800" mb={1}>
                Join your organization
              </Text>
              <Text fontSize="xs" color="gray.500" mb={5} lineHeight="1.5">
                Enter your organization admin's email to request access.
                They'll send you an invite to join your city's dashboard.
              </Text>
              <VStack spacing={3}>
                <Input
                  size="sm"
                  placeholder="admin@yourcity.gov"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  borderRadius="lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && orgEmail.trim()) setRequested(true);
                  }}
                />
                <Button
                  w="100%"
                  size="sm"
                  colorScheme="blue"
                  onClick={() => {
                    if (orgEmail.trim()) setRequested(true);
                  }}
                  isDisabled={!orgEmail.trim()}
                >
                  Request Access
                </Button>
              </VStack>
            </Box>
          ) : (
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
                bg="green.50"
                borderRadius="full"
                align="center"
                justify="center"
                mx="auto"
                mb={4}
              >
                <Icon as={FiCheck} boxSize={6} color="green.500" />
              </Flex>
              <Text fontSize="md" fontWeight="600" color="gray.800" mb={1}>
                Request sent
              </Text>
              <Text fontSize="xs" color="gray.500" mb={4} lineHeight="1.5">
                We've notified <strong>{orgEmail}</strong>. You'll be able to
                access the dashboard once they accept your request.
              </Text>
              <HStack justify="center" spacing={2} color="gray.400">
                <Icon as={FiClock} boxSize={3} />
                <Text fontSize="xs">Waiting for invitation...</Text>
              </HStack>
            </Box>
          )}

          <Text fontSize="xs" color="gray.400">
            Already have an invite? Check your email for the link.
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
