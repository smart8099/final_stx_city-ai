"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  Flex,
  Input,
  VStack,
  Text,
  HStack,
  Spinner,
  Icon,
  Badge,
  Image,
} from "@chakra-ui/react";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";
import { useConversations } from "@/lib/conversation-store";
import { useSettings } from "@/lib/settings-store";
import { Message } from "@/lib/types";

export default function ChatWidget() {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addConversation, addMessage, updateConversation } = useConversations();

  // Auto-open from settings
  useEffect(() => {
    if (settings.autoOpen) setIsOpen(true);
  }, [settings.autoOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const color = settings.primaryColor || "#1a56db";
  const title = settings.cityName || "CityAssist";
  const welcome = settings.welcomeMessage || "Hi! Ask me anything about city services, permits, utilities, or departments.";
  const maxH = settings.maxHeight ? `${settings.maxHeight}px` : "520px";

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    let convId = currentConvId;

    if (!convId) {
      convId = `conv-${Date.now()}`;
      setCurrentConvId(convId);
      addConversation({
        id: convId,
        sessionId: `sess-${Date.now().toString(36)}`,
        status: "new",
        messages: [userMsg],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      addMessage(convId, userMsg);
    }

    setLocalMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [...localMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: data.message || "Sorry, something went wrong.",
        intent: data.intent,
        department: data.department,
        confidence: data.confidence,
        timestamp: new Date().toISOString(),
      };

      setLocalMessages((prev) => [...prev, assistantMsg]);
      addMessage(convId, assistantMsg);

      // Set ticket status based on AI response
      if (convId) {
        if (data.needs_escalation) {
          updateConversation(convId, {
            status: "escalated",
            updatedAt: new Date().toISOString(),
          });
        } else if (data.resolved) {
          updateConversation(convId, {
            status: "resolved",
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, errorMsg]);
      addMessage(convId, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setLocalMessages([]);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <Box
          position="fixed"
          bottom="90px"
          right={settings.position === "bottom-left" ? undefined : "24px"}
          left={settings.position === "bottom-left" ? "24px" : undefined}
          w="380px"
          h={maxH}
          bg="white"
          borderRadius="xl"
          boxShadow="2xl"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          zIndex={1000}
          border="1px solid"
          borderColor="gray.200"
        >
          {/* Header */}
          <Flex
            bg={color}
            color="white"
            px={4}
            py={3}
            align="center"
            justify="space-between"
          >
            <HStack spacing={3}>
              {settings.logoUrl && (
                <Image
                  src={settings.logoUrl}
                  alt="Logo"
                  boxSize="28px"
                  borderRadius="md"
                  objectFit="contain"
                  bg="whiteAlpha.200"
                />
              )}
              <Box>
                <Text fontWeight="600" fontSize="sm">
                  {title}
                </Text>
                <Text fontSize="xs" opacity={0.8}>
                  Ask about city services
                </Text>
              </Box>
            </HStack>
            <HStack spacing={1}>
              <IconButton
                aria-label="New chat"
                icon={<Icon as={FiMessageCircle} />}
                size="xs"
                variant="ghost"
                color="whiteAlpha.700"
                _hover={{ color: "white" }}
                onClick={handleNewChat}
              />
              <IconButton
                aria-label="Close chat"
                icon={<Icon as={FiX} />}
                size="xs"
                variant="ghost"
                color="whiteAlpha.700"
                _hover={{ color: "white" }}
                onClick={() => setIsOpen(false)}
              />
            </HStack>
          </Flex>

          {/* Messages */}
          <VStack
            flex={1}
            overflowY="auto"
            spacing={3}
            px={4}
            py={3}
            align="stretch"
            bg="gray.50"
          >
            {localMessages.length === 0 && (
              <VStack spacing={2} py={8} color="gray.400">
                <Icon as={FiMessageCircle} boxSize={8} />
                <Text fontSize="sm" textAlign="center">
                  {welcome}
                </Text>
              </VStack>
            )}
            {localMessages.map((msg) => (
              <Flex
                key={msg.id}
                justify={msg.role === "user" ? "flex-end" : "flex-start"}
              >
                <Box maxW="80%">
                  <Box
                    bg={msg.role === "user" ? color : "white"}
                    color={msg.role === "user" ? "white" : "gray.800"}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    fontSize="sm"
                    boxShadow="sm"
                    border={msg.role === "assistant" ? "1px solid" : "none"}
                    borderColor="gray.200"
                  >
                    <Text lineHeight="1.5">{msg.content}</Text>
                  </Box>
                  {msg.role === "assistant" && settings.showDepartmentBadge && msg.department && (
                    <Badge fontSize="10px" colorScheme="blue" variant="subtle" mt={1}>
                      {msg.department}
                    </Badge>
                  )}
                </Box>
              </Flex>
            ))}
            {loading && (
              <Flex justify="flex-start">
                <HStack
                  bg="white"
                  px={3}
                  py={2}
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Spinner size="xs" color={color} />
                  <Text fontSize="sm" color="gray.500">
                    Thinking...
                  </Text>
                </HStack>
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </VStack>

          {/* Input */}
          <HStack p={3} borderTop="1px solid" borderColor="gray.200" bg="white">
            <Input
              size="sm"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              borderRadius="full"
              bg="gray.50"
            />
            <IconButton
              aria-label="Send"
              icon={<Icon as={FiSend} />}
              size="sm"
              bg={color}
              color="white"
              _hover={{ opacity: 0.9 }}
              borderRadius="full"
              onClick={handleSend}
              isLoading={loading}
            />
          </HStack>
        </Box>
      )}

      {/* Floating Button */}
      <IconButton
        aria-label="Open chat"
        icon={<Icon as={isOpen ? FiX : FiMessageCircle} boxSize={5} />}
        position="fixed"
        bottom="24px"
        right={settings.position === "bottom-left" ? undefined : "24px"}
        left={settings.position === "bottom-left" ? "24px" : undefined}
        size="lg"
        bg={color}
        color="white"
        _hover={{ opacity: 0.9 }}
        borderRadius="full"
        boxShadow="lg"
        onClick={() => setIsOpen(!isOpen)}
        zIndex={1000}
      />
    </>
  );
}
