"use client";

import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { Conversation, INTENT_LABELS } from "@/lib/types";
import ConversationThread from "./ConversationThread";

const STATUS_OPTIONS: { value: Conversation["status"]; label: string; color: string }[] = [
  { value: "new", label: "New", color: "blue" },
  { value: "open", label: "Open", color: "green" },
  { value: "escalated", label: "Escalated", color: "red" },
  { value: "resolved", label: "Resolved", color: "gray" },
];

interface Props {
  conversation: Conversation;
  onBack: () => void;
  onStatusChange: (id: string, status: Conversation["status"]) => void;
}

export default function TicketDetailPanel({ conversation, onBack, onStatusChange }: Props) {
  return (
    <Box flex={1} display="flex" flexDirection="column" bg="white" overflow="hidden">
      {/* Detail Header */}
      <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.200">
        <Flex align="center" justify="space-between" mb={2}>
          <HStack spacing={3}>
            <IconButton
              aria-label="Back to list"
              icon={<Icon as={FiArrowLeft} />}
              size="sm"
              variant="ghost"
              onClick={onBack}
            />
            <Text fontWeight="600" fontSize="sm" color="gray.800">
              Ticket #{conversation.id.split("-").pop()}
            </Text>
            <Badge
              colorScheme={STATUS_OPTIONS.find((s) => s.value === conversation.status)?.color || "gray"}
              textTransform="capitalize"
            >
              {conversation.status}
            </Badge>
          </HStack>
          <Select
            size="xs"
            w="130px"
            value={conversation.status}
            onChange={(e) =>
              onStatusChange(conversation.id, e.target.value as Conversation["status"])
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Flex>
        <HStack spacing={4} fontSize="xs" color="gray.500" pl={10}>
          <Text>Session: {conversation.sessionId}</Text>
          {conversation.department && <Text>Dept: {conversation.department}</Text>}
          {conversation.intent && (
            <Text>Intent: {INTENT_LABELS[conversation.intent] || conversation.intent}</Text>
          )}
          <Text>Created: {new Date(conversation.startedAt).toLocaleString()}</Text>
        </HStack>
      </Box>

      {/* Reuse existing ConversationThread */}
      <Box flex={1} overflow="auto">
        <ConversationThread conversation={conversation} hideHeader />
      </Box>
    </Box>
  );
}
