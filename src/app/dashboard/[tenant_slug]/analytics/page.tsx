"use client";

import { useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiMessageSquare,
  FiCheckCircle,
  FiBarChart2,
  FiHelpCircle,
  FiUsers,
} from "react-icons/fi";
import { useParams } from "next/navigation";
import { useConversations } from "@/lib/conversation-store";
import { useDepartments } from "@/lib/department-store";
import { INTENT_LABELS } from "@/lib/types";

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { conversations, setTenantSlug } = useConversations();
  const { departments, setTenantSlug: setDeptSlug } = useDepartments();

  useEffect(() => {
    setTenantSlug(slug);
    setDeptSlug(slug);
  }, [slug, setTenantSlug, setDeptSlug]);

  const stats = useMemo(() => {
    const total = conversations.length;
    const resolved = conversations.filter((c) => c.status === "resolved").length;
    const escalated = conversations.filter((c) => c.status === "escalated" || c.wasEscalated).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const avgMessages = total > 0 ? (totalMessages / total).toFixed(1) : "0";

    return { total, resolved, escalated, resolutionRate, escalationRate, avgMessages };
  }, [conversations]);

  const deptBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize with all departments from store
    departments.forEach((d) => { counts[d.name] = 0; });
    // Count conversations
    conversations.forEach((c) => {
      const dept = c.department || "Unassigned";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    if (!counts["Unassigned"]) {
      const unassigned = conversations.filter((c) => !c.department).length;
      if (unassigned > 0) counts["Unassigned"] = unassigned;
    }
    const total = conversations.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        conversations: count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.conversations - a.conversations);
  }, [conversations, departments]);

  const intentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    conversations.forEach((c) => {
      const intent = c.intent || "unknown";
      counts[intent] = (counts[intent] || 0) + 1;
    });
    const total = conversations.length || 1;
    return Object.entries(counts)
      .map(([intent, count]) => ({
        label: INTENT_LABELS[intent] || intent,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [conversations]);

  const topQuestions = useMemo(() => {
    return conversations
      .map((c) => {
        const firstUser = c.messages.find((m) => m.role === "user");
        return {
          question: firstUser?.content || "No message",
          department: c.department || "Unassigned",
          status: c.status,
        };
      })
      .slice(0, 10);
  }, [conversations]);

  const escalatedTickets = useMemo(() => {
    return conversations
      .filter((c) => c.status === "escalated")
      .map((c) => {
        const firstUser = c.messages.find((m) => m.role === "user");
        return {
          question: firstUser?.content || "No message",
          department: c.department || "Unassigned",
        };
      })
      .slice(0, 10);
  }, [conversations]);

  return (
    <Box p={8} maxW="100%">
      <Box mb={6}>
        <Heading size="md" color="gray.800">Analytics</Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Live conversation metrics from {stats.total} conversation{stats.total !== 1 ? "s" : ""}
        </Text>
      </Box>

      {/* Stat Cards */}
      <Flex gap={4} mb={8} flexWrap="wrap">
        <StatCard
          label="Total Conversations"
          value={String(stats.total)}
          icon={FiMessageSquare}
          color="blue"
        />
        <StatCard
          label="Resolution Rate"
          value={stats.total > 0 ? `${stats.resolutionRate}%` : "--"}
          sub={`${stats.resolved} solved`}
          icon={FiCheckCircle}
          color="green"
        />
        <StatCard
          label="Escalation Rate"
          value={stats.total > 0 ? `${stats.escalationRate}%` : "--"}
          sub={`${stats.escalated} escalated`}
          icon={FiAlertCircle}
          color="red"
        />
        <StatCard
          label="Avg. Messages"
          value={stats.avgMessages}
          sub="per conversation"
          icon={FiMessageSquare}
          color="purple"
        />
      </Flex>

      {/* Department Breakdown */}
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5} mb={8}>
        <HStack spacing={2} mb={4}>
          <Icon as={FiBarChart2} color="gray.400" boxSize={4} />
          <Text fontWeight="600" fontSize="sm" color="gray.700">Department Breakdown</Text>
        </HStack>
        {deptBreakdown.length === 0 ? (
          <Text fontSize="sm" color="gray.400">No conversations yet</Text>
        ) : (
          <VStack spacing={3} align="stretch">
            {deptBreakdown.map((dept) => (
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
        )}
      </Box>

      {/* Intent Breakdown */}
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5} mb={8}>
        <HStack spacing={2} mb={4}>
          <Icon as={FiUsers} color="gray.400" boxSize={4} />
          <Text fontWeight="600" fontSize="sm" color="gray.700">Intent Breakdown</Text>
        </HStack>
        {intentBreakdown.length === 0 ? (
          <Text fontSize="sm" color="gray.400">No conversations yet</Text>
        ) : (
          <VStack spacing={3} align="stretch">
            {intentBreakdown.map((item) => (
              <Box key={item.label}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.700">{item.label}</Text>
                  <Text fontSize="xs" color="gray.400">{item.count} ({item.pct}%)</Text>
                </Flex>
                <Box bg="gray.100" borderRadius="full" h="6px" overflow="hidden">
                  <Box
                    bg="purple.400"
                    h="100%"
                    borderRadius="full"
                    w={`${item.pct}%`}
                    transition="width 0.3s"
                  />
                </Box>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      <Flex gap={6} flexWrap="wrap">
        {/* Recent Questions */}
        <Box flex="1" minW="400px" bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <HStack spacing={2} mb={4}>
            <Icon as={FiMessageSquare} color="gray.400" boxSize={4} />
            <Text fontWeight="600" fontSize="sm" color="gray.700">Recent Questions</Text>
          </HStack>
          {topQuestions.length === 0 ? (
            <Text fontSize="sm" color="gray.400">No conversations yet</Text>
          ) : (
            <VStack spacing={0} align="stretch">
              {topQuestions.map((q, i) => (
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
                    <Text fontSize="sm" color="gray.700" noOfLines={1}>{q.question}</Text>
                    <Text fontSize="xs" color="gray.400">{q.department}</Text>
                  </Box>
                  <Badge
                    colorScheme={
                      q.status === "resolved" ? "green" :
                      q.status === "escalated" ? "red" :
                      q.status === "new" ? "orange" : "blue"
                    }
                    variant="subtle"
                    fontSize="10px"
                    textTransform="capitalize"
                  >
                    {q.status}
                  </Badge>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>

        {/* Escalated Tickets */}
        <Box flex="1" minW="400px" bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <HStack spacing={2} mb={4}>
            <Icon as={FiHelpCircle} color="orange.400" boxSize={4} />
            <Text fontWeight="600" fontSize="sm" color="gray.700">Escalated Tickets</Text>
          </HStack>
          <Text fontSize="xs" color="gray.400" mb={3}>
            Conversations that were escalated and may need attention.
          </Text>
          {escalatedTickets.length === 0 ? (
            <Text fontSize="sm" color="gray.400">No escalated tickets</Text>
          ) : (
            <VStack spacing={0} align="stretch">
              {escalatedTickets.map((q, i) => (
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
                    <Text fontSize="sm" color="gray.700" noOfLines={1}>{q.question}</Text>
                    <Text fontSize="xs" color="gray.400">{q.department}</Text>
                  </Box>
                  <Badge colorScheme="red" variant="subtle" fontSize="10px">Escalated</Badge>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      px={5}
      py={4}
      flex="1"
      minW="180px"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color="gray.500" fontWeight="500">{label}</Text>
        <Icon as={icon} color={`${color}.400`} boxSize={4} />
      </HStack>
      <Text fontSize="2xl" fontWeight="700" color="gray.800">{value}</Text>
      {sub && <Text fontSize="xs" color="gray.400">{sub}</Text>}
    </Box>
  );
}
