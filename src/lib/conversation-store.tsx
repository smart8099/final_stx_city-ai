"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Conversation, Message } from "./types";

interface ConversationStore {
  conversations: Conversation[];
  addConversation: (conv: Conversation) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  getConversation: (id: string) => Conversation | undefined;
  tenantSlug: string;
  setTenantSlug: (slug: string) => void;
}

const ConversationContext = createContext<ConversationStore | null>(null);

function getStorageKey(tenant: string) {
  return `cityassist_conversations_${tenant}`;
}

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load conversations scoped to tenant
  useEffect(() => {
    if (!tenantSlug) return;
    const key = getStorageKey(tenantSlug);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setConversations(JSON.parse(stored));
      } catch {
        setConversations([]);
      }
    } else {
      setConversations([]);
    }
    setLoaded(true);
  }, [tenantSlug]);

  // Save conversations scoped to tenant
  useEffect(() => {
    if (loaded && tenantSlug) {
      const key = getStorageKey(tenantSlug);
      localStorage.setItem(key, JSON.stringify(conversations));
    }
  }, [conversations, loaded, tenantSlug]);

  const addConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => [conv, ...prev]);
  }, []);

  const addMessage = useCallback((conversationId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, message],
              updatedAt: message.timestamp,
              department: message.department || c.department,
              intent: message.intent || c.intent,
              status: message.intent === "emergency" ? "escalated" : c.status,
            }
          : c
      )
    );
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id),
    [conversations]
  );

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        addConversation,
        addMessage,
        updateConversation,
        getConversation,
        tenantSlug,
        setTenantSlug,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversations must be used within ConversationProvider");
  return ctx;
}
