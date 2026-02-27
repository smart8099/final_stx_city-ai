"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex,
  Divider,
} from "@chakra-ui/react";
import {
  FiTrendingUp,
  FiAlertCircle,
  FiMessageSquare,
  FiCheckCircle,
  FiBarChart2,
  FiHelpCircle,
} from "react-icons/fi";

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

const STATS: StatCard[] = [
  { label: "Total Conversations", value: "0", change: "--", icon: FiMessageSquare, color: "blue" },
  { label: "Resolution Rate", value: "--", change: "--", icon: FiCheckCircle, color: "green" },
  { label: "Avg. Confidence", value: "--", change: "--", icon: FiTrendingUp, color: "purple" },
  { label: "Escalation Rate", value: "--", change: "--", icon: FiAlertCircle, color: "red" },
];

const TOP_QUESTIONS: { question: string; count: number; department: string }[] = [];

const UNRESOLVED_QUESTIONS: { question: string; count: number; department: string }[] = [];

const DEPT_BREAKDOWN: { name: string; conversations: number; pct: number }[] = [];

export default function AnalyticsPage() {
  return (
    <Box p={8} maxW="100%">
      <Box mb={6}>
        <Heading size="md" color="gray.800">Analytics</Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Conversation metrics and knowledge base gap identification
        </Text>
      </Box>

      {/* Stat Cards */}
      <Flex gap={4} mb={8} flexWrap="wrap">
        {STATS.map((stat) => (
          <Box
            key={stat.label}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            px={5}
            py={4}
            flex="1"
            minW="200px"
          >
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" color="gray.500" fontWeight="500">{stat.label}</Text>
              <Icon as={stat.icon} color={`${stat.color}.400`} boxSize={4} />
            </HStack>
            <HStack align="baseline" spacing={2}>
              <Text fontSize="2xl" fontWeight="700" color="gray.800">{stat.value}</Text>
              <Badge
                colorScheme={stat.change.startsWith("+") ? "green" : "red"}
                fontSize="10px"
                variant="subtle"
              >
                {stat.change}
              </Badge>
            </HStack>
          </Box>
        ))}
      </Flex>

      {/* Department Breakdown */}
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5} mb={8}>
        <HStack spacing={2} mb={4}>
          <Icon as={FiBarChart2} color="gray.400" boxSize={4} />
          <Text fontWeight="600" fontSize="sm" color="gray.700">Department Breakdown</Text>
        </HStack>
        <VStack spacing={3} align="stretch">
          {DEPT_BREAKDOWN.map((dept) => (
            <Box key={dept.name}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" color="gray.700">{dept.name}</Text>
                <Text fontSize="xs" color="gray.400">{dept.conversations} ({dept.pct}%)</Text>
              </Flex>
              <Box bg="gray.100" borderRadius="full" h="6px" overflow="hidden">
                <Box
                  bg="blue.400"
                  h="100%"
                  borderRadius="full"
                  w={`${dept.pct}%`}
                  transition="width 0.3s"
                />
              </Box>
            </Box>
          ))}
        </VStack>
      </Box>

      <Flex gap={6} flexWrap="wrap">
        {/* Top Questions */}
        <Box flex="1" minW="400px" bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <HStack spacing={2} mb={4}>
            <Icon as={FiMessageSquare} color="gray.400" boxSize={4} />
            <Text fontWeight="600" fontSize="sm" color="gray.700">Top Questions</Text>
          </HStack>
          <VStack spacing={0} align="stretch">
            {TOP_QUESTIONS.map((q, i) => (
              <Flex
                key={i}
                py={2.5}
                align="center"
                justify="space-between"
                borderBottom="1px solid"
                borderColor="gray.50"
                _last={{ borderBottom: "none" }}
              >
                <Box flex={1} mr={3}>
                  <Text fontSize="sm" color="gray.700">{q.question}</Text>
                  <Text fontSize="xs" color="gray.400">{q.department}</Text>
                </Box>
                <Badge colorScheme="blue" variant="subtle" fontSize="10px">{q.count}</Badge>
              </Flex>
            ))}
          </VStack>
        </Box>

        {/* Unresolved — KB Gap */}
        <Box flex="1" minW="400px" bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <HStack spacing={2} mb={4}>
            <Icon as={FiHelpCircle} color="orange.400" boxSize={4} />
            <Text fontWeight="600" fontSize="sm" color="gray.700">Unresolved — KB Gaps</Text>
          </HStack>
          <Text fontSize="xs" color="gray.400" mb={3}>
            Questions the AI couldn't answer confidently. Add these to the Knowledge Base.
          </Text>
          <VStack spacing={0} align="stretch">
            {UNRESOLVED_QUESTIONS.map((q, i) => (
              <Flex
                key={i}
                py={2.5}
                align="center"
                justify="space-between"
                borderBottom="1px solid"
                borderColor="gray.50"
                _last={{ borderBottom: "none" }}
              >
                <Box flex={1} mr={3}>
                  <Text fontSize="sm" color="gray.700">{q.question}</Text>
                  <Text fontSize="xs" color="gray.400">{q.department}</Text>
                </Box>
                <Badge colorScheme="orange" variant="subtle" fontSize="10px">{q.count}</Badge>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}
