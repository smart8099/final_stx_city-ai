"use client";

import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight, FiInbox } from "react-icons/fi";
import { Conversation, INTENT_LABELS } from "@/lib/types";

const TICKETS_PER_PAGE = 10;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: "blue", label: "New" },
  open: { color: "green", label: "Open" },
  escalated: { color: "red", label: "Escalated" },
  resolved: { color: "gray", label: "Resolved" },
};

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

export default function TicketTable({
  conversations,
  selectedId,
  currentPage,
  onPageChange,
  onSelect,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(conversations.length / TICKETS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * TICKETS_PER_PAGE;
  const pageTickets = conversations.slice(startIdx, startIdx + TICKETS_PER_PAGE);

  const getSubject = (conv: Conversation) => {
    const firstUserMsg = conv.messages.find((m) => m.role === "user");
    if (!firstUserMsg) return "No subject";
    const text = firstUserMsg.content;
    return text.length > 60 ? text.slice(0, 60) + "..." : text;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Box flex={1} display="flex" flexDirection="column" bg="gray.50" overflow="hidden">
      {/* Table Header */}
      <Flex
        px={4}
        py={2.5}
        bg="gray.100"
        borderBottom="1px solid"
        borderColor="gray.200"
        fontSize="xs"
        fontWeight="600"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        <Text w="90px">Status</Text>
        <Text flex={1}>Subject</Text>
        <Text w="120px">Requester</Text>
        <Text w="100px">Intent</Text>
        <Text w="120px">Department</Text>
        <Text w="80px" textAlign="right">Updated</Text>
      </Flex>

      {/* Rows */}
      <Box flex={1} overflowY="auto">
        {pageTickets.length === 0 && (
          <Flex direction="column" align="center" py={16} color="gray.400">
            <Icon as={FiInbox} boxSize={10} mb={3} />
            <Text fontSize="sm" fontWeight="500">No tickets</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
              Tickets will appear here when users start conversations
            </Text>
          </Flex>
        )}
        {pageTickets.map((conv) => {
          const cfg = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open;
          const isSelected = conv.id === selectedId;
          return (
            <Flex
              key={conv.id}
              px={4}
              py={3}
              align="center"
              cursor="pointer"
              bg={isSelected ? "blue.50" : "white"}
              borderBottom="1px solid"
              borderColor="gray.100"
              _hover={{ bg: isSelected ? "blue.50" : "gray.50" }}
              onClick={() => onSelect(conv.id)}
              transition="background 0.1s"
            >
              <Box w="90px">
                <Badge
                  colorScheme={cfg.color}
                  fontSize="10px"
                  textTransform="capitalize"
                >
                  {cfg.label}
                </Badge>
              </Box>
              <Text flex={1} fontSize="sm" fontWeight="500" color="gray.700" noOfLines={1}>
                {getSubject(conv)}
              </Text>
              <Text w="120px" fontSize="xs" color="gray.500" noOfLines={1}>
                {conv.sessionId}
              </Text>
              <Box w="100px">
                {conv.intent ? (
                  <Badge fontSize="10px" colorScheme="purple" variant="subtle">
                    {INTENT_LABELS[conv.intent] || conv.intent}
                  </Badge>
                ) : (
                  <Text fontSize="xs" color="gray.400">—</Text>
                )}
              </Box>
              <Text w="120px" fontSize="xs" color="gray.500" noOfLines={1}>
                {conv.department || "—"}
              </Text>
              <Text w="80px" fontSize="xs" color="gray.400" textAlign="right">
                {formatTime(conv.updatedAt)}
              </Text>
            </Flex>
          );
        })}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex
          px={4}
          py={3}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          align="center"
          justify="space-between"
        >
          <Text fontSize="xs" color="gray.500">
            {startIdx + 1}–{Math.min(startIdx + TICKETS_PER_PAGE, conversations.length)} of{" "}
            {conversations.length}
          </Text>
          <HStack spacing={1}>
            <IconButton
              aria-label="Previous page"
              icon={<Icon as={FiChevronLeft} />}
              size="xs"
              variant="ghost"
              isDisabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <Text key={`e${i}`} fontSize="xs" color="gray.400" px={1}>
                  ...
                </Text>
              ) : (
                <Button
                  key={p}
                  size="xs"
                  variant={p === page ? "solid" : "ghost"}
                  colorScheme={p === page ? "blue" : "gray"}
                  minW="28px"
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <IconButton
              aria-label="Next page"
              icon={<Icon as={FiChevronRight} />}
              size="xs"
              variant="ghost"
              isDisabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
