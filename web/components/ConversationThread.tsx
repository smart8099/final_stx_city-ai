"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Icon,
  Alert,
  AlertIcon,
  Link,
} from "@chakra-ui/react";
import { FiFile } from "react-icons/fi";
import { Conversation, INTENT_LABELS } from "@/lib/types";

interface Props {
  conversation: Conversation | null;
  hideHeader?: boolean;
}

export default function ConversationThread({ conversation, hideHeader }: Props) {
  /**
   * Maps message ID → list of department names that were triggered by that message.
   * Used to render routing badges below trigger messages in the thread.
   */
  const triggerMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const rd of conversation?.routedDepartments ?? []) {
      if (rd.triggerMessageId) {
        const existing = map.get(rd.triggerMessageId) ?? [];
        map.set(rd.triggerMessageId, [...existing, rd.departmentName]);
      }
    }
    return map;
  }, [conversation?.routedDepartments]);
  if (!conversation) {
    return (
      <Flex flex={1} align="center" justify="center" color="gray.400">
        <Text>Select a conversation to view</Text>
      </Flex>
    );
  }

  return (
    <Box flex={1} display="flex" flexDirection="column" h="100%">
      {!hideHeader && (
        <>
          <Box
            px={6}
            py={4}
            borderBottom="1px solid"
            borderColor="gray.200"
            bg="white"
          >
            <HStack justify="space-between">
              <Box>
                <HStack spacing={2} mb={1}>
                  <Text fontWeight="600" fontSize="md">
                    Session {conversation.sessionId}
                  </Text>
                  <Badge
                    colorScheme={
                      conversation.status === "open"
                        ? "green"
                        : conversation.status === "escalated"
                        ? "red"
                        : "gray"
                    }
                    textTransform="capitalize"
                  >
                    {conversation.status}
                  </Badge>
                </HStack>
                <HStack spacing={3} fontSize="xs" color="gray.500">
                  {conversation.department && (
                    <Text>Dept: {conversation.department}</Text>
                  )}
                  {conversation.intent && (
                    <Text>
                      Intent: {INTENT_LABELS[conversation.intent] || conversation.intent}
                    </Text>
                  )}
                  <Text>
                    Started: {new Date(conversation.startedAt).toLocaleString()}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Box>

          {conversation.status === "escalated" && (
            <Alert status="error" variant="left-accent" fontSize="sm">
              <AlertIcon />
              This conversation has been escalated to {conversation.department || "a department"}.
            </Alert>
          )}
        </>
      )}

      <VStack
        spacing={4}
        align="stretch"
        flex={1}
        overflowY="auto"
        px={6}
        py={4}
      >
        {conversation.messages.map((msg) => (
          <Flex
            key={msg.id}
            direction="column"
            align={msg.role === "user" ? "flex-end" : "flex-start"}
          >
            <Box
              maxW="70%"
              bg={msg.role === "user" ? "blue.500" : "white"}
              color={msg.role === "user" ? "white" : "gray.800"}
              px={4}
              py={3}
              borderRadius="lg"
              borderTopRightRadius={msg.role === "user" ? "4px" : "lg"}
              borderTopLeftRadius={msg.role === "assistant" ? "4px" : "lg"}
              boxShadow="sm"
              border={msg.role === "assistant" ? "1px solid" : "none"}
              borderColor="gray.200"
            >
              <Box fontSize="sm" lineHeight="1.6">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <Link href={href} isExternal color="blue.500" fontWeight="600" textDecoration="underline">
                        {children}
                      </Link>
                    ),
                    strong: ({ children }) => (
                      <Text as="strong" fontWeight="700">{children}</Text>
                    ),
                    p: ({ children }) => (
                      <Text mb={1}>{children}</Text>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </Box>

              {msg.role === "assistant" && (
                <Box mt={2} pt={2} borderTop="1px solid" borderColor="gray.100">
                  <HStack spacing={2} flexWrap="wrap">
                    {msg.intent && (
                      <Badge fontSize="10px" colorScheme="purple" variant="subtle">
                        {INTENT_LABELS[msg.intent] || msg.intent}
                      </Badge>
                    )}
                    {msg.department && (
                      <Badge fontSize="10px" colorScheme="blue" variant="subtle">
                        {msg.department}
                      </Badge>
                    )}
                  </HStack>

                  {msg.sources && msg.sources.length > 0 && (
                    <VStack align="start" spacing={1} mt={2}>
                      {msg.sources.map((src, i) => (
                        <HStack key={i} spacing={1} fontSize="11px" color="gray.500">
                          <Icon as={FiFile} boxSize={3} />
                          <Text>
                            {src.file}
                            {src.page && `, p.${src.page}`}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>
              )}

              <Text
                fontSize="10px"
                color={msg.role === "user" ? "blue.100" : "gray.400"}
                mt={1}
                textAlign="right"
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Box>

            {triggerMap.has(msg.id) && (
              <HStack spacing={1} mt={1} flexWrap="wrap">
                {triggerMap.get(msg.id)!.map((deptName) => (
                  <Badge key={deptName} fontSize="9px" colorScheme="blue" variant="subtle">
                    → {deptName}
                  </Badge>
                ))}
              </HStack>
            )}
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
