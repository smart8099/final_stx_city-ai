"use client";

import { Box, VStack, HStack, Text, Icon, Badge } from "@chakra-ui/react";
import {
  FiInbox,
  FiAlertCircle,
  FiMessageSquare,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { Conversation } from "@/lib/types";

export type ViewFilter = "all" | "new" | "open" | "escalated" | "resolved";

interface Props {
  conversations: Conversation[];
  activeView: ViewFilter;
  onViewChange: (view: ViewFilter) => void;
}

const VIEWS: { key: ViewFilter; label: string; icon: typeof FiInbox; color: string }[] = [
  { key: "all", label: "All Tickets", icon: FiInbox, color: "gray.600" },
  { key: "new", label: "New", icon: FiAlertCircle, color: "blue.500" },
  { key: "open", label: "Open", icon: FiMessageSquare, color: "green.500" },
  { key: "escalated", label: "Escalated", icon: FiAlertTriangle, color: "red.500" },
  { key: "resolved", label: "Resolved", icon: FiCheckCircle, color: "gray.400" },
];

export default function TicketSidebar({ conversations, activeView, onViewChange }: Props) {
  const getCount = (view: ViewFilter) => {
    if (view === "all") return conversations.length;
    return conversations.filter((c) => c.status === view).length;
  };

  return (
    <Box
      w="200px"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      flexShrink={0}
      py={4}
    >
      <Text fontSize="xs" fontWeight="600" color="gray.400" px={4} mb={3} textTransform="uppercase" letterSpacing="wider">
        Views
      </Text>
      <VStack spacing={0} align="stretch">
        {VIEWS.map((view) => {
          const isActive = activeView === view.key;
          const count = getCount(view.key);
          return (
            <HStack
              key={view.key}
              px={4}
              py={2}
              cursor="pointer"
              bg={isActive ? "blue.50" : "transparent"}
              color={isActive ? "blue.700" : "gray.600"}
              _hover={{ bg: isActive ? "blue.50" : "gray.50" }}
              onClick={() => onViewChange(view.key)}
              justify="space-between"
              transition="all 0.1s"
            >
              <HStack spacing={2}>
                <Icon as={view.icon} boxSize={3.5} color={isActive ? "blue.500" : view.color} />
                <Text fontSize="sm" fontWeight={isActive ? "600" : "400"}>
                  {view.label}
                </Text>
              </HStack>
              {count > 0 && (
                <Badge
                  fontSize="10px"
                  borderRadius="full"
                  px={1.5}
                  minW="20px"
                  textAlign="center"
                  colorScheme={isActive ? "blue" : "gray"}
                  variant="subtle"
                >
                  {count}
                </Badge>
              )}
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
