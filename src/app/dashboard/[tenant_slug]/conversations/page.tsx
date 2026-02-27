"use client";

import { useState, useEffect, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { useConversations } from "@/lib/conversation-store";
import TicketSidebar, { ViewFilter } from "@/components/TicketSidebar";
import TicketTable from "@/components/TicketTable";
import TicketDetailPanel from "@/components/TicketDetailPanel";
import ChatWidget from "@/components/ChatWidget";

export default function ConversationsPage() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { conversations, getConversation, updateConversation, setTenantSlug } =
    useConversations();

  const [activeView, setActiveView] = useState<ViewFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setTenantSlug(slug);
  }, [slug, setTenantSlug]);

  // Reset page when view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView]);

  const filtered = useMemo(() => {
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (activeView === "all") return sorted;
    return sorted.filter((c) => c.status === activeView);
  }, [conversations, activeView]);

  const selectedConversation = selectedId ? getConversation(selectedId) || null : null;

  const handleStatusChange = (id: string, status: string) => {
    updateConversation(id, {
      status: status as "new" | "open" | "resolved" | "escalated",
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <Flex h="100vh" overflow="hidden">
        <TicketSidebar
          conversations={conversations}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        {selectedConversation ? (
          <TicketDetailPanel
            conversation={selectedConversation}
            onBack={() => setSelectedId(null)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <TicketTable
            conversations={filtered}
            selectedId={selectedId}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSelect={setSelectedId}
          />
        )}
      </Flex>
      <ChatWidget />
    </>
  );
}
